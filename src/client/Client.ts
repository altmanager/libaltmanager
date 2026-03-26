import type { Compound, NBT, Tags, TagType } from "prismarine-nbt";
import nbt from "prismarine-nbt";
import { Buffer } from "node:buffer";
import { Connection } from "./Connection.ts";
import { State } from "./State.ts";
import { TypedEventTarget } from "../TypedEventTarget.ts";
import type { ClientEvents } from "./ClientEvents.ts";
import type { Session } from "../Session.ts";
import type { ClientPacket } from "./packet/ClientPacket.ts";
import { VarInt } from "./VarInt.ts";
import { ClientInformation } from "./packet/client/ClientInformation.ts";
import { ConfigurationAcknowledged } from "./packet/client/ConfigurationAcknowledged.ts";
import { ConfigurationKeepAlive as ClientConfigurationKeepAlive } from "./packet/client/ConfigurationKeepAlive.ts";
import { ConfigurationResourcePack } from "./packet/client/ConfigurationResourcePack.ts";
import { FinishConfiguration } from "./packet/client/FinishConfiguration.ts";
import { Hello as ClientHello } from "./packet/client/Hello.ts";
import { Intention } from "./packet/client/Intention.ts";
import { Key } from "./packet/client/Key.ts";
import { LoginAcknowledged } from "./packet/client/LoginAcknowledged.ts";
import { PlayKeepAlive as ClientPlayKeepAlive } from "./packet/client/PlayKeepAlive.ts";
import { PlayResourcePack } from "./packet/client/PlayResourcePack.ts";
import { SelectKnownPacks as ClientSelectKnownPacks } from "./packet/client/SelectKnownPacks.ts";
import { ConfigurationDisconnect } from "./packet/server/ConfigurationDisconnect.ts";
import { ConfigurationKeepAlive as ServerConfigurationKeepAlive } from "./packet/server/ConfigurationKeepAlive.ts";
import { ConfigurationResourcePackPush } from "./packet/server/ConfigurationResourcePackPush.ts";
import { ConfigurationTransfer } from "./packet/server/ConfigurationTransfer.ts";
import { FinishConfiguration as ServerFinishConfiguration } from "./packet/server/FinishConfiguration.ts";
import { Hello as ServerHello } from "./packet/server/Hello.ts";
import { Login } from "./packet/server/Login.ts";
import { LoginCompression } from "./packet/server/LoginCompression.ts";
import { LoginDisconnect } from "./packet/server/LoginDisconnect.ts";
import { LoginFinished } from "./packet/server/LoginFinished.ts";
import { PlayDisconnect } from "./packet/server/PlayDisconnect.ts";
import { PlayKeepAlive as ServerPlayKeepAlive } from "./packet/server/PlayKeepAlive.ts";
import { PlayResourcePackPush } from "./packet/server/PlayResourcePackPush.ts";
import { PlayTransfer } from "./packet/server/PlayTransfer.ts";
import { SelectKnownPacks as ServerSelectKnownPacks } from "./packet/server/SelectKnownPacks.ts";
import { StartConfiguration } from "./packet/server/StartConfiguration.ts";
import { SystemChat } from "./packet/server/SystemChat.ts";
import { Chat } from "./packet/client/Chat.ts";
import { RegistryData } from "./packet/server/RegistryData.ts";
import { RegistryManager } from "./registry/RegistryManager.ts";
import { RegistryId } from "./registry/RegistryId.ts";
import { Registry } from "./registry/Registry.ts";
import { ChatType } from "./registry/ChatType.ts";
import { DisguisedChat } from "./packet/server/DisguisedChat.ts";

/**
 * Manages the Minecraft Java Edition protocol state machine.
 */
export class Client extends TypedEventTarget<ClientEvents> {
  private static readonly KEEPALIVE_TIMEOUT_MS = 30_000;

  private readonly session: Session;
  private readonly brand: string;
  private connection: Connection = new Connection();
  private state: State = State.LOGIN;
  private transferring = false;
  private keepAliveWatchdog: ReturnType<typeof setInterval> | null = null;
  private lastKeepAliveMs: number = 0;
  private readonly registries = new RegistryManager();

  /**
   * @param session Session to authenticate with.
   * @param brand Client brand string sent to the server.
   */
  public constructor(session: Session, brand: string) {
    super();
    this.session = session;
    this.brand = brand;
  }

  private static parseChatType(entry: any): ChatType {
    return {
      chat: {
        translationKey: entry.chat.translation_key,
        parameters: entry.chat.parameters,
        style: entry.chat.style,
      },
      narration: {
        translationKey: entry.narration.translation_key,
        parameters: entry.narration.parameters,
        style: entry.narration.style,
      },
    };
  }

  /**
   * Connects to a Minecraft server and begins the protocol handshake.
   *
   * @param host Hostname or IP address.
   * @param port TCP port.
   */
  public async connect(host: string, port: number): Promise<void> {
    this.stopKeepAliveWatchdog();
    this.connection = new Connection();
    this.state = State.LOGIN;
    this.transferring = false;

    await this.connection.connect(host, port);
    await this.sendPacket(new Intention(host, port));
    await this.sendPacket(
      new ClientHello(this.session.username, this.session.uuid),
    );

    this.readLoop().catch((e) => {
      console.error(`[Client] readLoop uncaught:`, e);
      this.handleDisconnect();
    });
  }

  /**
   * Closes the connection.
   */
  public disconnect(): void {
    this.connection.close();
  }

  /**
   * Sends an unsigned chat message.
   *
   * @param message Message to send.
   */
  public async chat(message: string): Promise<void> {
    await this.sendPacket(
      new Chat(
        message.slice(0, 256),
        BigInt(Date.now()),
        crypto.getRandomValues(new BigInt64Array(1))[0],
        null,
        0,
        0b00000000000000000000n,
        1,
      ),
    );
    if (message.length > 256) {
      await this.chat(message.slice(256));
    }
  }

  private async readLoop(): Promise<void> {
    try {
      while (true) {
        const payload = await this.connection.readPacket();
        if (payload === null) {
          break;
        }
        try {
          await this.handlePacket(payload);
        } catch (e) {
          console.error("[Client] Error handling packet, ignoring:", e);
        }
      }
    } finally {
      if (!this.transferring) {
        this.handleDisconnect();
      }
    }
  }

  private handleDisconnect(): void {
    this.stopKeepAliveWatchdog();
    this.connection.close();
    this.dispatchEvent("disconnect", void 0);
  }

  private async handlePacket(payload: Uint8Array<ArrayBuffer>): Promise<void> {
    const [packetId, idSize] = VarInt.decode(payload, 0);
    const buf = payload.slice(idSize);

    switch (this.state) {
      case State.LOGIN:
        await this.handleLoginPacket(packetId, buf);
        break;
      case State.CONFIGURATION:
        await this.handleConfigurationPacket(packetId, buf);
        break;
      case State.PLAY:
        await this.handlePlayPacket(packetId, buf);
        break;
    }
  }

  private async handleLoginPacket(
    packetId: number,
    buf: Uint8Array<ArrayBuffer>,
  ): Promise<void> {
    switch (packetId) {
      case ServerHello.ID:
        await this.handleHello(new ServerHello(buf));
        break;
      case LoginCompression.ID:
        this.connection.setCompressionThreshold(
          new LoginCompression(buf).threshold,
        );
        break;
      case LoginFinished.ID:
        this.startKeepAliveWatchdog();
        await this.sendPacket(new LoginAcknowledged());
        this.state = State.CONFIGURATION;
        await this.sendPacket(new ClientInformation());
        break;
      case LoginDisconnect.ID:
        this.dispatchEvent("kick", new LoginDisconnect(buf).reason);
        break;
    }
  }

  private async handleConfigurationPacket(
    packetId: number,
    buf: Uint8Array<ArrayBuffer>,
  ): Promise<void> {
    switch (packetId) {
      case ServerConfigurationKeepAlive.ID:
        this.lastKeepAliveMs = Date.now();
        await this.sendPacket(
          new ClientConfigurationKeepAlive(
            new ServerConfigurationKeepAlive(buf).id,
          ),
        );
        break;
      case ConfigurationResourcePackPush.ID:
        await this.sendPacket(
          new ConfigurationResourcePack(
            new ConfigurationResourcePackPush(buf).uuid,
            0,
          ),
        );
        break;
      case ServerSelectKnownPacks.ID:
        await this.sendPacket(new ClientSelectKnownPacks());
        break;
      case ServerFinishConfiguration.ID:
        await this.sendPacket(new FinishConfiguration());
        this.state = State.PLAY;
        break;
      case ConfigurationDisconnect.ID:
        this.dispatchEvent("kick", new ConfigurationDisconnect(buf).reason);
        break;
      case ConfigurationTransfer.ID:
        await this.handleTransfer(new ConfigurationTransfer(buf));
        break;
      case RegistryData.ID: {
        const packet = new RegistryData(buf);
        const data = packet.entries.map(({ id, data }) => ({
          id,
          data: data === null ? null : nbt.simplify(data),
        }));
        switch (packet.registryId) {
          case RegistryId.CHAT_TYPE:
            this.registries.set(
              RegistryId.CHAT_TYPE,
              new Registry(data.map((entry) => ({
                id: entry.id,
                value: Client.parseChatType(entry.data),
              }))),
            );
            break;
        }
        break;
      }
    }
  }

  private async handlePlayPacket(
    packetId: number,
    buf: Uint8Array<ArrayBuffer>,
  ): Promise<void> {
    switch (packetId) {
      case Login.ID:
        this.startKeepAliveWatchdog();
        this.dispatchEvent("login", void 0);
        break;
      case ServerPlayKeepAlive.ID:
        this.lastKeepAliveMs = Date.now();
        await this.sendPacket(
          new ClientPlayKeepAlive(new ServerPlayKeepAlive(buf).id),
        );
        break;
      case StartConfiguration.ID:
        await this.sendPacket(new ConfigurationAcknowledged());
        this.state = State.CONFIGURATION;
        break;
      case PlayResourcePackPush.ID:
        await this.sendPacket(
          new PlayResourcePack(new PlayResourcePackPush(buf).uuid, 0),
        );
        break;
      case PlayDisconnect.ID:
        this.dispatchEvent("kick", new PlayDisconnect(buf).reason);
        break;
      case PlayTransfer.ID:
        await this.handleTransfer(new PlayTransfer(buf));
        break;
      case SystemChat.ID: {
        const packet = new SystemChat(buf);
        if (packet.overlay) {
          break;
        }
        this.dispatchEvent("chat", packet.content);
        break;
      }
      case DisguisedChat.ID: {
        this.handleDisguisedChat(new DisguisedChat(buf));
        break;
      }
    }
  }

  private async handleHello(packet: ServerHello): Promise<void> {
    const sharedSecret = crypto.getRandomValues(
      new Uint8Array(16),
    );

    const { publicEncrypt, constants } = await import("node:crypto");

    const pem = `-----BEGIN PUBLIC KEY-----\n${
      btoa(String.fromCharCode(...packet.publicKey)).match(/.{1,64}/g)!.join(
        "\n",
      )
    }\n-----END PUBLIC KEY-----`;

    const encryptedSecret = publicEncrypt(
      { key: pem, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(sharedSecret),
    ) as Uint8Array<ArrayBuffer>;

    const encryptedVerifyToken = publicEncrypt(
      { key: pem, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(packet.verifyToken),
    ) as Uint8Array<ArrayBuffer>;

    if (packet.shouldAuthenticate) {
      await this.joinSession(packet.serverId, sharedSecret, packet.publicKey);
    }

    await this.sendPacket(new Key(encryptedSecret, encryptedVerifyToken));
    this.connection.enableEncryption(sharedSecret);
  }

  private async handleTransfer(
    packet: ConfigurationTransfer | PlayTransfer,
  ): Promise<void> {
    this.transferring = true;
    this.connection.close();
    try {
      await this.connect(packet.host, packet.port);
    } catch (e) {
      console.error(
        `[Client] Failed to transfer to ${packet.host}:${packet.port}:`,
        e,
      );
      this.transferring = false;
      this.handleDisconnect();
    }
  }

  private handleDisguisedChat(packet: DisguisedChat): void {
    const chatType: ChatType = typeof packet.chatType === "number"
      ? this.registries.get(RegistryId.CHAT_TYPE)!.getByIndex(packet.chatType)!
      : Client.parseChatType(nbt.simplify(packet.chatType));

    const toCompound = (tag: Tags[TagType]): Compound =>
      tag.type === "compound" ? tag : nbt.comp({
        text: nbt.string(tag.value as string),
      }) as unknown as Compound;

    const paramMap: Record<string, Compound> = {
      sender: toCompound(packet.senderName),
      content: toCompound(packet.message),
      ...(packet.targetName !== null
        ? { target: toCompound(packet.targetName) }
        : {}),
    };

    const component = nbt.comp({
      translate: nbt.string(chatType.chat.translationKey),
      with: nbt.list({
        type: "compound",
        value: chatType.chat.parameters.map((p) => paramMap[p].value),
      }),
      ...Object.fromEntries(
        Object.entries(chatType.chat.style ?? {}).map(([k, v]) => [
          k,
          typeof v === "string"
            ? nbt.string(v)
            : typeof v === "number"
            ? nbt.int(v)
            : nbt.byte(v ? 1 : 0),
        ]),
      ),
    }, "") as unknown as NBT;

    this.dispatchEvent("chat", component);
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
      throw new Error(
        `Session join failed: ${response.status} ${await response.text()}`,
      );
    }
  }

  private async computeServerHash(
    serverId: string,
    sharedSecret: Uint8Array<ArrayBuffer>,
    publicKey: Uint8Array<ArrayBuffer>,
  ): Promise<string> {
    const serverIdBytes = new TextEncoder().encode(serverId);
    const combined = new Uint8Array(
      serverIdBytes.length + sharedSecret.length + publicKey.length,
    );
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

  private sendPacket(packet: ClientPacket): Promise<void> {
    return this.connection.writePacket(packet.serialize());
  }

  private startKeepAliveWatchdog(): void {
    this.stopKeepAliveWatchdog();
    this.lastKeepAliveMs = Date.now();
    this.keepAliveWatchdog = setInterval(() => {
      if (Date.now() - this.lastKeepAliveMs > Client.KEEPALIVE_TIMEOUT_MS) {
        this.connection.close();
      }
    }, Client.KEEPALIVE_TIMEOUT_MS);
  }

  private stopKeepAliveWatchdog(): void {
    if (this.keepAliveWatchdog !== null) {
      clearInterval(this.keepAliveWatchdog);
      this.keepAliveWatchdog = null;
    }
  }
}
