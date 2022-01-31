import React, { useEffect } from "react";
import styles from "./../styles";
import {
  Card,
} from "antd";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";

const Chart = ({
  id,
  data,
  title,
  legendLabelText
}) => {
  useEffect(() => {
    const root = am5.Root.new(id);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root?.verticalHorizontal,
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        name: "Series",
        valueField: "value",
        categoryField: "side",
        legendLabelText: legendLabelText,
        legendValueText: "{value}"
      })
    );
    series.get("colors").set("colors", [
      am5.color(0x262626),
      am5.color(0xff4d4f)
    ]);
    series.data.setAll(data);
    series.labels.template.set("visible", false);
    series.ticks.template.set("visible", false);

    const legend = chart.children.push(am5.Legend.new(root, {
      layout: root.verticalLayout,
      clickTarget: "none"
    }));
    legend.data.setAll(series.dataItems);

    return () => root?.dispose();
  }, [data])

  return (
    <Card>
      <p style={styles.text}>{title}</p>
      <div id={id} style={{ width: "100%", height: "150px" }}></div>
    </Card>
  );
}

export default Chart;
