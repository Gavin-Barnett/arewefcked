export const revalidate = 900;

export async function GET() {
  return Response.json({
    clusters: [],
    note: "News clustering remains empty until GDELT and NewsAPI are live. The runtime will not fabricate headlines."
  });
}
