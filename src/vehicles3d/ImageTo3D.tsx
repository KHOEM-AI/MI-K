import { useRef, useState } from "react";
import { downloadBlob } from "./modelExporter";

type Props = {
  endpoint?: string;
};

/** The server answers errors as { "error": "..." }; show only that text. */
function errorText(raw: string, status: number): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    // not JSON: fall through
  }
  return raw || `AI API Error: ${status}`;
}

export default function ImageTo3D({ endpoint = "/api/image-to-3d" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  function chooseImage(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("សូមជ្រើសរើសរូបភាព PNG ឬ JPG");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
    setMessage("");
    setWarning("");
  }

  async function generate() {
    if (!file) {
      setError("សូម Upload រូបភាព 2D ជាមុន");
      return;
    }

    setBusy(true);
    setError("");
    setWarning("");
    setMessage("កំពុងបង្កើតម៉ូដែល 3D... (អាចចំណាយពេលច្រើននាទី)");

    try {
      const form = new FormData();
      form.append("image", file);

      const response = await fetch(endpoint, { method: "POST", body: form });

      if (!response.ok) {
        throw new Error(errorText(await response.text(), response.status));
      }

      const contentType = response.headers.get("content-type") || "";

      if (
        contentType.includes("model/gltf-binary") ||
        contentType.includes("application/octet-stream")
      ) {
        const blob = await response.blob();
        downloadBlob(blob, "khoem-ai-generated.glb");
        const size = response.headers.get("x-model-size");
        if (response.headers.get("x-test-data") === "true") {
          setWarning(
            "⚠ នេះជាម៉ូដែលសាកល្បង (test placeholder) មិនមែនបង្កើតពីរូបភាពរបស់បងទេ។ ត្រូវបើក provider AI ពិត។"
          );
        }
        setMessage(
          `បានទាញយក GLB រួចរាល់${size ? ` · ទំហំ ${size} ម៉ែត្រ` : ""}`
        );
        return;
      }

      const result: { glbUrl?: string; error?: string } = await response.json();

      if (result.glbUrl) {
        const glbResponse = await fetch(result.glbUrl);
        if (!glbResponse.ok) {
          throw new Error("មិនអាចទាញយក GLB បាន");
        }
        const blob = await glbResponse.blob();
        downloadBlob(blob, "khoem-ai-generated.glb");
        setMessage("បានបង្កើត និងទាញយក GLB រួចរាល់");
        return;
      }

      throw new Error(result.error || "AI API មិនបានផ្ញើ GLB ឬ glbUrl មកទេ");
    } catch (e) {
      setError(e instanceof Error ? e.message : "បង្កើត 3D មិនបាន");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      style={{
        padding: 16,
        border: "1px solid #555",
        borderRadius: 12,
        display: "grid",
        gap: 12,
      }}
    >
      <h2>2D Image → AI 3D → GLB</h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => chooseImage(e.target.files?.[0])}
      />

      {preview && (
        <img
          src={preview}
          alt="2D reference"
          style={{
            width: "100%",
            maxHeight: 260,
            objectFit: "contain",
            background: "#222",
            borderRadius: 8,
          }}
        />
      )}

      <button
        type="button"
        disabled={!file || busy}
        onClick={() => void generate()}
        style={{ padding: 12, borderRadius: 8, cursor: "pointer" }}
      >
        {busy ? "កំពុងបង្កើត 3D..." : "Generate 3D + Export GLB"}
      </button>

      {message && <p>{message}</p>}
      {warning && <p style={{ color: "orange" }}>{warning}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </section>
  );
}
