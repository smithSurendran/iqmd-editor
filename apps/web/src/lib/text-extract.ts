interface ProseMirrorNode {
  type?: string;
  text?: string;
  content?: ProseMirrorNode[];
}

export function extractPlainText(node: unknown): string {
  if (!node) return "";
  if (typeof node !== "object") return "";

  const proseMirrorNode = node as ProseMirrorNode;
  if (proseMirrorNode.type === "text") return proseMirrorNode.text ?? "";
  if (!proseMirrorNode.content) return "";

  const childText = proseMirrorNode.content.map(extractPlainText).join("");
  if (
    proseMirrorNode.type === "paragraph" ||
    proseMirrorNode.type === "heading" ||
    proseMirrorNode.type === "listItem"
  ) {
    return childText + "\n";
  }
  return childText;
}
