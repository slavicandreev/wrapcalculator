/// <reference types="vite/client" />

// Teach TypeScript that *.css?inline imports resolve to a string
declare module '*.css?inline' {
  const content: string;
  export default content;
}
