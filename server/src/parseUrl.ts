import R from "ramda";

export type ParsedUrl = {
  protocol: string;
  host: string;
  path: string[];
  query: {
    [key: string]: string;
  };
}

export default function parseUrl(url: string) : ParsedUrl {
  const {
    protocol,
    host,
    pathname,
    searchParams
  } = new URL(url)
  return {
    protocol,
    host,
    path: pathname.split("/"),
    query: R.fromPairs([...(searchParams as any)]) as { [key: string]: string }
  }
}
