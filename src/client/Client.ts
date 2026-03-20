import { Connection } from "./Connection.ts";
import { PacketReader } from "./PacketReader.ts";
import { PacketWriter } from "./PacketWriter.ts";
import { PacketID } from "./PacketID.ts";
import { State } from "./State.ts";
import { TypedEventTarget } from "../TypedEventTarget.ts";
import type { ClientEvents } from "./ClientEvents.ts";
import type { Session } from "../Session.ts";

/**
 * Manages the Minecraft Java Edition protocol state machine.
 */
export class Client extends TypedEventTarget<ClientEvents> {
  private static readonly PROTOCOL_VERSION = 774;

  private readonly session: Session;
  private readonly brand: string;
  private connection: Connection = new Connection();
  private state: State = State.LOGIN;
  private transferring = false;

  /**
   * @param session Session to authenticate with.
   * @param brand Client brand string sent to the server.
   */
  public constructor(session: Session, brand: string) {
    super();
    this.session = session;
    this.brand = brand;
  }

  /**
   * Connects to a Minecraft server and begins the protocol handshake.
   *
   * @param host Hostname or IP address.
   * @param port TCP port.
   */
  public async connect(host: string, port: number): Promise<void> {
    this.connection = new Connection();
    this.state = State.LOGIN;
    this.transferring = false;

    await this.connection.connect(host, port);
    await this.sendHandshake(host, port);
    await this.sendLoginStart();

    this.readLoop().catch(() => this.handleDisconnect());
  }

  /**
   * Closes the connection.
   */
  public disconnect(): void {
    this.connection.close();
  }

  private async readLoop(): Promise<void> {
    try {
      while (true) {
        const payload = await this.connection.readPacket();
        if (payload === null) {
          break;
        }
        await this.handlePacket(payload as Uint8Array<ArrayBuffer>);
      }
    } finally {
      if (!this.transferring) {
        this.handleDisconnect();
      }
    }
  }

  private handleDisconnect(): void {
    this.connection.close();
    this.dispatchEvent("disconnect", void 0);
  }

  private async handlePacket(payload: Uint8Array<ArrayBuffer>): Promise<void> {
    const reader = new PacketReader(payload);
    const packetId = reader.readVarInt();

    switch (this.state) {
      case State.LOGIN:
        await this.handleLoginPacket(packetId, reader);
        break;
      case State.CONFIGURATION:
        await this.handleConfigurationPacket(packetId, reader);
        break;
      case State.PLAY:
        await this.handlePlayPacket(packetId, reader);
        break;
    }
  }

  private async handleLoginPacket(
    packetId: number,
    reader: PacketReader,
  ): Promise<void> {
    switch (packetId) {
      case PacketID.SERVER_HELLO:
        await this.handleHello(reader);
        break;
      case PacketID.SERVER_LOGIN_COMPRESSION:
        this.connection.setCompressionThreshold(reader.readVarInt());
        break;
      case PacketID.SERVER_LOGIN_FINISHED:
        await this.sendPacket(
          new PacketWriter()
            .writeVarInt(PacketID.CLIENT_LOGIN_ACKNOWLEDGED)
            .build(),
        );
        this.state = State.CONFIGURATION;
        break;
      case PacketID.SERVER_LOGIN_DISCONNECT:
        this.connection.close();
        break;
    }
  }

  private async handleConfigurationPacket(
    packetId: number,
    reader: PacketReader,
  ): Promise<void> {
    switch (packetId) {
      case PacketID.SERVER_SELECT_KNOWN_PACKS:
        await this.sendPacket(
          new PacketWriter()
            .writeVarInt(PacketID.CLIENT_SELECT_KNOWN_PACKS)
            .writeVarInt(0)
            .build(),
        );
        break;
      case PacketID.SERVER_KEEP_ALIVE:
        await this.handleKeepAlive(reader, PacketID.CLIENT_KEEP_ALIVE);
        break;
      case PacketID.SERVER_RESOURCE_PACK_PUSH:
        await this.handleResourcePackPush(
          reader,
          PacketID.CLIENT_RESOURCE_PACK,
        );
        break;
      case PacketID.SERVER_FINISH_CONFIGURATION:
        await this.sendPacket(
          new PacketWriter()
            .writeVarInt(PacketID.CLIENT_FINISH_CONFIGURATION)
            .build(),
        );
        this.state = State.PLAY;
        break;
      case PacketID.SERVER_DISCONNECT:
        this.connection.close();
        break;
    }
  }

  private async handlePlayPacket(
    packetId: number,
    reader: PacketReader,
  ): Promise<void> {
    switch (packetId) {
      case PacketID.SERVER_LOGIN:
        this.dispatchEvent("login", void 0);
        break;
      case PacketID.SERVER_KEEP_ALIVE_PLAY:
        await this.handleKeepAlive(reader, PacketID.CLIENT_KEEP_ALIVE_PLAY);
        break;
      case PacketID.SERVER_START_CONFIGURATION:
        await this.sendPacket(
          new PacketWriter()
            .writeVarInt(PacketID.CLIENT_CONFIGURATION_ACKNOWLEDGED)
            .build(),
        );
        this.state = State.CONFIGURATION;
        break;
      case PacketID.SERVER_RESOURCE_PACK_PUSH_PLAY:
        await this.handleResourcePackPush(
          reader,
          PacketID.CLIENT_RESOURCE_PACK_PLAY,
        );
        break;
      case PacketID.SERVER_TRANSFER:
        await this.handleTransfer(reader);
        break;
      case PacketID.SERVER_DISCONNECT_PLAY:
        this.connection.close();
        break;
    }
  }

  private async handleHello(reader: PacketReader): Promise<void> {
    const serverId = reader.readString();
    const publicKey = reader.readByteArray();
    const verifyToken = reader.readByteArray();

    const sharedSecret = crypto.getRandomValues(
      new Uint8Array(16) as Uint8Array<ArrayBuffer>,
    );

    const importedKey = await crypto.subtle.importKey(
      "spki",
      publicKey,
      { name: "RSA-OAEP", hash: "SHA-1" },
      false,
      ["encrypt"],
    );

    const encryptedSecret = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        importedKey,
        sharedSecret,
      ),
    ) as Uint8Array<ArrayBuffer>;

    const encryptedVerifyToken = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        importedKey,
        verifyToken,
      ),
    ) as Uint8Array<ArrayBuffer>;

    await this.joinSession(serverId, sharedSecret, publicKey);

    await this.sendPacket(
      new PacketWriter()
        .writeVarInt(PacketID.CLIENT_KEY)
        .writeByteArray(encryptedSecret)
        .writeByteArray(encryptedVerifyToken)
        .build(),
    );

    this.connection.enableEncryption(sharedSecret);
  }

  private async joinSession(
    serverId: string,
    sharedSecret: Uint8Array<ArrayBuffer>,
    publicKey: Uint8Array<ArrayBuffer>,
  ): Promise<void> {
    const hash = await this.computeServerHash(
      serverId,
      sharedSecret,
      publicKey,
    );

    const response = await fetch(
      "https://sessionserver.mojang.com/session/minecraft/join",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: this.session.token,
          selectedProfile: this.session.uuid.replaceAll("-", ""),
          serverId: hash,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Session join failed: ${response.status}`);
    }
  }

  private async computeServerHash(
    serverId: string,
    sharedSecret: Uint8Array<ArrayBuffer>,
    publicKey: Uint8Array<ArrayBuffer>,
  ): Promise<string> {
    const serverIdBytes = new TextEncoder().encode(serverId) as Uint8Array<
      ArrayBuffer
    >;
    const combined = new Uint8Array(
      serverIdBytes.length + sharedSecret.length + publicKey.length,
    ) as Uint8Array<ArrayBuffer>;
    combined.set(serverIdBytes);
    combined.set(sharedSecret, serverIdBytes.length);
    combined.set(publicKey, serverIdBytes.length + sharedSecret.length);

    const hashBytes = new Uint8Array(
      await crypto.subtle.digest("SHA-1", combined),
    );
    const hex = Array.from(hashBytes).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    return BigInt.asIntN(160, BigInt(`0x${hex}`)).toString(16);
  }

  private async handleKeepAlive(
    reader: PacketReader,
    responseId: number,
  ): Promise<void> {
    const id = reader.readLong();
    await this.sendPacket(
      new PacketWriter()
        .writeVarInt(responseId)
        .writeLong(id)
        .build(),
    );
  }

  private async handleResourcePackPush(
    reader: PacketReader,
    responseId: number,
  ): Promise<void> {
    const uuid = reader.readUuid();
    reader.readString();
    reader.readString();
    reader.readBoolean();

    await this.sendPacket(
      new PacketWriter()
        .writeVarInt(responseId)
        .writeUuid(uuid)
        .writeVarInt(0)
        .build(),
    );
  }

  private async handleTransfer(reader: PacketReader): Promise<void> {
    const host = reader.readString();
    const port = reader.readUnsignedShort();

    this.transferring = true;
    this.connection.close();
    await this.connect(host, port);
  }

  private async sendHandshake(host: string, port: number): Promise<void> {
    await this.sendPacket(
      new PacketWriter()
        .writeVarInt(PacketID.HANDSHAKING_INTENTION)
        .writeVarInt(Client.PROTOCOL_VERSION)
        .writeString(host)
        .writeUnsignedShort(port)
        .writeVarInt(2)
        .build(),
    );
  }

  private async sendLoginStart(): Promise<void> {
    await this.sendPacket(
      new PacketWriter()
        .writeVarInt(PacketID.CLIENT_HELLO)
        .writeString(this.session.username)
        .writeUuid(this.session.uuid)
        .build(),
    );
  }

  private sendPacket(payload: Uint8Array<ArrayBuffer>): Promise<void> {
    return this.connection.writePacket(payload);
  }
}
