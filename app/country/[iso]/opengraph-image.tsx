import { ImageResponse } from "next/og";
import { ShareCard } from "@/lib/og/share-card";
import { getCountryByCode } from "@/lib/countries/starter-countries";

export const alt = "Are we Fcked? country share card with risk dial";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default async function OpenGraphImage(props: { params: Promise<{ iso: string }> }) {
  const params = await props.params;
  const country = getCountryByCode(params.iso);
  const countryName = country?.name ?? params.iso.toUpperCase();
  const countryCode = country?.code ?? params.iso.toUpperCase();

  return new ImageResponse(
    <ShareCard
      eyebrow="Country severity index"
      title={countryName}
      subtitle={`Shareable country risk read for ${countryName}, backed by live signals and explainable scoring.`}
      footer={`Country view / ${countryCode}`}
      centerText={countryCode}
      caption="Country share"
    />,
    size
  );
}