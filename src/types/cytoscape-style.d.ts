import type cytoscape from "cytoscape";

export type CytoscapeStyle = {
  selector: string;
  style: cytoscape.Css.Node | cytoscape.Css.Edge;
};
