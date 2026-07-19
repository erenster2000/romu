// Asset imports resolve to inlined data URIs via Romu's asset pipeline.
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.webp" {
  const src: string;
  export default src;
}
declare module "*.mp3" {
  const src: string;
  export default src;
}
declare module "*.m4a" {
  const src: string;
  export default src;
}
