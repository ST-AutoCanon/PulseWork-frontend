import React, { useRef } from "react";
import styles from "./UploadScan.module.css";

export default function FieldPropertiesPanel({
  boxes,
  bodyBoxes,
  selectedFieldId,
  setSelectedFieldId,
  updateSelectedFieldStyle,
  updateSelectedFieldContent,
  updateSelectedFieldTable,
  pageStyle = { background: "transparent" },
  updatePageStyle = null,
  onUploadImage,
}) {
  const list = Array.isArray(boxes)
    ? boxes
    : Array.isArray(bodyBoxes)
      ? bodyBoxes
      : [];

  const sel =
    selectedFieldId && list.length
      ? list.find((b) => String(b.id) === String(selectedFieldId))
      : null;

  const fileRef = useRef(null);

  if (!selectedFieldId || !sel) {
    return (
      <div className={styles.fieldPanelEmpty}>
        Select a field on the preview to edit its properties
      </div>
    );
  }

  const s = sel.style || {};
  const fontSize = s.fontSize ?? 11;
  const textAlign = s.textAlign ?? "left";
  const color = s.color ?? "#0f1724";
  const background = s.background ?? "transparent";
  const bold = String(s.fontWeight || "") === "700" || s.fontWeight === 700;
  const paddingVal = s.padding ?? 6;

  const headerBackground = s.headerBackground ?? "#f8fafc";
  const headerColor = s.headerColor ?? "#0f1724";
  const rowBackground = s.rowBackground ?? "transparent";
  const rowColor = s.rowColor ?? "#0f1724";
  const borderColor = s.borderColor ?? "#cbd5e1";

  const isTable = sel.type === "table";
  const isImage = sel.type === "image" || sel.type === "logo";
  const tableData = sel.table?.data || [];
  const rowCount = tableData.length;
  const colCount = tableData[0]?.length || 0;

  function addRow() {
    if (!updateSelectedFieldTable) return;

    const newRow = Array.from({ length: colCount || 1 }).map(() => "");

    updateSelectedFieldTable({
      ...sel.table,
      data: [...tableData, newRow],
      rows: rowCount + 1,
    });
  }

  function removeRow() {
    if (!updateSelectedFieldTable || rowCount <= 1) return;

    updateSelectedFieldTable({
      ...sel.table,
      data: tableData.slice(0, -1),
      rows: rowCount - 1,
    });
  }

  function addCol() {
    if (!updateSelectedFieldTable) return;

    const newData = tableData.map((row) => [...row, ""]);

    updateSelectedFieldTable({
      ...sel.table,
      data: newData,
      cols: colCount + 1,
    });
  }

  function removeCol() {
    if (!updateSelectedFieldTable || colCount <= 1) return;

    const newData = tableData.map((row) => row.slice(0, -1));

    updateSelectedFieldTable({
      ...sel.table,
      data: newData,
      cols: colCount - 1,
    });
  }

  function onColorChange(next) {
    if (!updateSelectedFieldStyle) return;
    updateSelectedFieldStyle(next);
  }

  function handleFileClick() {
    if (!fileRef.current) return;
    try {
      fileRef.current.value = "";
    } catch (e) {}
    fileRef.current.click();
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    try {
      e.target.value = "";
    } catch (err) {}
    if (!f) return;
    if (typeof onUploadImage === "function") {
      try {
        onUploadImage(f, sel);
        return;
      } catch (err) {
        console.warn("onUploadImage threw", err);
      }
    }
    try {
      const url = URL.createObjectURL(f);
      if (updateSelectedFieldContent) updateSelectedFieldContent(url);
    } catch (err) {
      console.warn("creating blob url failed", err);
    }
  }

  return (
    <div className={styles.fieldPanel}>
      <div className={styles.panelHeader}>Field properties</div>

      <div className={styles.propsGrid}>
        <div className={styles.propItem}>
          <div className={styles.label}>Page</div>
          <input
            className={styles.colorInput}
            type="color"
            value={
              pageStyle.background === "transparent"
                ? "#ffffff"
                : pageStyle.background
            }
            onChange={(e) =>
              updatePageStyle &&
              updatePageStyle({ ...pageStyle, background: e.target.value })
            }
            aria-label="Page background color"
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={pageStyle.background !== "transparent"}
              onChange={(e) =>
                updatePageStyle &&
                updatePageStyle({
                  ...pageStyle,
                  background: e.target.checked
                    ? pageStyle.background || "#ffffff"
                    : "transparent",
                })
              }
            />
            show
          </label>
        </div>

        <div className={styles.propItem}>
          <div className={styles.label}>Text</div>
          <input
            className={styles.colorInput}
            type="color"
            value={color}
            onChange={(e) =>
              updateSelectedFieldStyle &&
              updateSelectedFieldStyle({ ...s, color: e.target.value })
            }
            aria-label="Text color"
          />
          <div className={styles.mono}>{color}</div>
        </div>

        <div className={styles.propItem}>
          <div className={styles.label}>Padding</div>
          <input
            className={styles.numInput}
            type="number"
            min={0}
            max={64}
            value={paddingVal}
            onChange={(e) =>
              updateSelectedFieldStyle &&
              updateSelectedFieldStyle({
                ...s,
                padding: Number(e.target.value) || 0,
              })
            }
            aria-label="Padding"
          />
        </div>

        <div className={styles.propItem}>
          <div className={styles.label}>Background</div>
          <input
            className={styles.colorInput}
            type="color"
            value={background === "transparent" ? "#ffffff" : background}
            onChange={(e) =>
              updateSelectedFieldStyle &&
              updateSelectedFieldStyle({ ...s, background: e.target.value })
            }
            aria-label="Background color"
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={background !== "transparent"}
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({
                  ...s,
                  background: e.target.checked
                    ? s.background || "#ffffff"
                    : "transparent",
                })
              }
            />
            show
          </label>
        </div>

        <div className={styles.propItem}>
          <div className={styles.label}>Align</div>
          <div className={styles.alignBtns}>
            {["left", "center", "right"].map((al) => (
              <button
                key={al}
                type="button"
                className={`${styles.smallBtn} ${
                  textAlign === al ? styles.smallBtnActive : ""
                }`}
                onClick={() =>
                  updateSelectedFieldStyle &&
                  updateSelectedFieldStyle({ ...s, textAlign: al })
                }
                aria-label={`Align ${al}`}
              >
                {al[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.propItem}>
          <div className={styles.label}>Font</div>
          <input
            className={styles.numInput}
            type="number"
            min={6}
            max={72}
            value={fontSize}
            onChange={(e) =>
              updateSelectedFieldStyle &&
              updateSelectedFieldStyle({
                ...s,
                fontSize: Number(e.target.value) || 11,
              })
            }
            aria-label="Font size"
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={bold}
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({
                  ...s,
                  fontWeight: e.target.checked ? 700 : 400,
                })
              }
            />
            <span>Bold</span>
          </label>
        </div>

        {isImage && (
          <div className={styles.propItem}>
            <div className={styles.label}>Image</div>
            <button
              type="button"
              className={styles.previewBtn}
              onClick={handleFileClick}
            >
              Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        )}

        <div className={styles.propItemRight}>
          <button
            className={styles.doneBtnCompact}
            type="button"
            onClick={() => setSelectedFieldId && setSelectedFieldId(null)}
          >
            Done
          </button>
        </div>
      </div>

      {isTable && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>Table styling</div>

          <div className={styles.tableRow}>
            <div className={styles.labelSmall}>Header bg</div>
            <input
              className={styles.colorInput}
              type="color"
              value={headerBackground}
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({
                  ...s,
                  headerBackground: e.target.value,
                })
              }
            />
            <div className={styles.labelSmall}>Header txt</div>
            <input
              className={styles.colorInput}
              type="color"
              value={headerColor}
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({ ...s, headerColor: e.target.value })
              }
            />
            <div className={styles.labelSmall}>Row bg</div>
            <input
              className={styles.colorInput}
              type="color"
              value={
                rowBackground === "transparent" ? "#ffffff" : rowBackground
              }
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({
                  ...s,
                  rowBackground: e.target.value,
                })
              }
            />
            <div className={styles.labelSmall}>Row txt</div>
            <input
              className={styles.colorInput}
              type="color"
              value={rowColor}
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({ ...s, rowColor: e.target.value })
              }
            />
            <div className={styles.labelSmall}>Border</div>
            <input
              className={styles.colorInput}
              type="color"
              value={borderColor}
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({ ...s, borderColor: e.target.value })
              }
            />
          </div>

          <div className={styles.tableRow}>
            <div className={styles.labelSmall}>Table font</div>
            <input
              className={styles.numInput}
              type="number"
              min={8}
              max={20}
              value={s.fontSize ?? 11}
              onChange={(e) =>
                updateSelectedFieldStyle &&
                updateSelectedFieldStyle({
                  ...s,
                  fontSize: Number(e.target.value) || 11,
                })
              }
            />

            <button type="button" className={styles.smallBtn} onClick={addRow}>
              + Row
            </button>

            <button
              type="button"
              className={styles.smallBtn}
              onClick={removeRow}
              disabled={rowCount <= 1}
            >
              - Row
            </button>

            <button type="button" className={styles.smallBtn} onClick={addCol}>
              + Col
            </button>

            <button
              type="button"
              className={styles.smallBtn}
              onClick={removeCol}
              disabled={colCount <= 1}
            >
              - Col
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
