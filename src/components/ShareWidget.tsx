import ShareButton from "./ShareButton";

interface ShareWidgetProps {
  title: string;
  text?: string;
  url?: string;
}

const ShareWidget = ({ title, text, url }: ShareWidgetProps) => {
  const fullUrl = url && typeof window !== "undefined" && url.startsWith("/")
    ? `${window.location.origin}${url}`
    : url;

  return (
    <div className="flex items-center justify-center">
      <ShareButton title={title} text={text} url={fullUrl} variant="pill" />
    </div>
  );
};

export default ShareWidget;
