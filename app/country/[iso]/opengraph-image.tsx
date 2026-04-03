import { ImageResponse } from "next/og";
import { getCountryByCode } from "@/lib/countries/starter-countries";
import { ShareCard } from "@/lib/og/share-card";

export const alt = "Are we Fcked? country share card with risk dial";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage(props: {
  params: Promise<{ iso: string }>;
}) {
  const params = await props.params;
  const country = getCountryByCode(params.iso);
  const countryName = country?.name ?? params.iso.toUpperCase();
  const countryCode = country?.code ?? params.iso.toUpperCase();

  return new ImageResponse(
    <ShareCard
      caption="Country share"
      centerText={countryCode}
      eyebrow="Country severity index"
      footer={`Country view / ${countryCode}`}
      subtitle={`Shareable country risk read for ${countryName}, backed by live signals and explainable scoring.`}
      title={countryName}
    />,
    size
  );
}
