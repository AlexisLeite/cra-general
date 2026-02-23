const Rules = 1000;

export class Priorities {
  public Canvas_Rules = Rules;

  public Change_History = 0;

  public Click_Node = 100;

  public Drag_Rules = Rules;

  public Drag_Node_Distances_Balancer = 400;
  public Drag_Node_Straight_Drag = 300;
  public Drag_Node_Aligner = 200;
  public Drag_Node_Snap_To_Grid = 100;
  public Drag_Edge_Snap_To_Grid = 100;

  public Mouse_Down_Rules = Rules;
  public Mouse_Down_Measurer = 400;
  public Mouse_Down_Selector = 300;
  public Mouse_Down_Node = 200;
  public Mouse_Down_Dragger = 100;

  public Mouse_Move_Straight_Drag = 500;
  public Mouse_Move_Selector = 100;

  public Mouse_Up_Straight_Drag = 500;
  public Mouse_Up_Dragger = 200;
  public Mouse_Up_Selector = 100;

  public Nodes_Connection_Rules = Rules;

  public Node_Selection_Nodes_Resizer = 200;
  public Node_Selection_Selector = 200;

  public Scale_Dragger = 100;

  public Selection_Rules = Rules;
}
