import { NextRequest, NextResponse } from "next/server";

type GenerateImageBody = {
  prompt?: string;
  format?: "thumbnail" | "detail";
  productImages?: string[];
};

function validDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(value);
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(",", 2);
  const mime = header.match(/^data:(image\/(?:jpeg|png|webp));base64$/)?.[1];
  if (!mime || !encoded) throw new Error("Invalid image data");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { blob: new Blob([bytes], { type: mime }), extension: mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg" };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ code: "NO_API_KEY" }, { status: 503 });

  let body: GenerateImageBody;
  try {
    body = (await request.json()) as GenerateImageBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const images = (body.productImages ?? []).filter(validDataUrl).slice(0, 4);
  if (!prompt || !images.length) return NextResponse.json({ error: "프롬프트와 제품 사진이 필요합니다." }, { status: 400 });

  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  form.append("prompt", `${prompt}\n\n[참조 이미지 적용 규칙]\n제공된 제품 사진은 동일한 실제 제품의 참조 이미지다. 제품의 고유 형태, 패키지 디자인, 색상, 비율, 로고, 부품 수와 위치를 최대한 정확히 보존한다. 존재하지 않는 기능이나 구성품을 만들지 않는다. MORIVA 브랜드 팔레트는 딥 네이비 #071A35, 화이트, 골드 #C9961A를 사용한다.`);
  form.append("size", body.format === "detail" ? "1024x1536" : "1024x1024");
  form.append("quality", "medium");
  // Vercel Functions cap response bodies at 4.5 MB. WEBP keeps generated
  // 1024px commerce images comfortably below that limit in normal use.
  form.append("output_format", "webp");
  form.append("output_compression", "85");

  try {
    images.forEach((image, index) => {
      const { blob, extension } = dataUrlToBlob(image);
      form.append("image[]", blob, `product-reference-${index + 1}.${extension}`);
    });

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const payload = (await response.json()) as {
      data?: Array<{ b64_json?: string }>;
      error?: { message?: string; code?: string };
    };
    if (!response.ok) {
      console.error("OpenAI image error", response.status, payload.error?.code, payload.error?.message);
      return NextResponse.json({ error: payload.error?.message || "이미지를 만들지 못했습니다." }, { status: response.status });
    }
    const base64 = payload.data?.[0]?.b64_json;
    if (!base64) return NextResponse.json({ error: "생성된 이미지를 읽지 못했습니다." }, { status: 502 });
    return NextResponse.json({ image: `data:image/webp;base64,${base64}`, model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2" });
  } catch (error) {
    console.error("Generate image route failed", error);
    return NextResponse.json({ error: "이미지 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
