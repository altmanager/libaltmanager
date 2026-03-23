export interface ChatType {
  chat: ChatTypeDecoration;
  narration: ChatTypeDecoration;
}

interface ChatTypeDecoration {
  translationKey: string;
  parameters: string[];
  style?: Partial<ChatTypeDecorationStyle>;
}

interface ChatTypeDecorationStyle {
  color: string;
  font: string;
  bold: boolean;
  italic: boolean;
  underlined: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
  shadowColor: number;
}
