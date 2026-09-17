/**
 * Mammoth ships a prebundled browser build. We use it directly instead of the
 * Node entry point so DOCX parsing runs in the browser with no polyfills and no
 * document ever leaves the device.
 */
declare module "mammoth/mammoth.browser.min.js" {
  interface MammothMessage {
    type: string;
    message: string;
  }

  interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  interface MammothInput {
    arrayBuffer: ArrayBuffer;
  }

  interface MammothOptions {
    styleMap?: string | string[];
    includeDefaultStyleMap?: boolean;
    ignoreEmptyParagraphs?: boolean;
  }

  export function convertToHtml(
    input: MammothInput,
    options?: MammothOptions,
  ): Promise<MammothResult>;

  export function extractRawText(input: MammothInput): Promise<MammothResult>;
}
