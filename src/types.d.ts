declare module "*.module.css" {
  const styles: Readonly<Record<string, string>>;
  export default styles;
}

declare module "*?type=raw" {
  const content: string;
  export default content;
}

// needed until TypeScript adds support for this
// https://github.com/microsoft/TypeScript/issues/46135
declare module "*.css" {
  const sheet: CSSStyleSheet;

  export default sheet;
}
