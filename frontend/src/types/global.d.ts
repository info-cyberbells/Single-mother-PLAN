// Required for Next.js App Router to declare client-side modules
declare module "*.svg" {
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
