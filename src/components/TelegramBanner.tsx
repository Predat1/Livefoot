import SocialBanner from "./SocialBanner";

interface TelegramBannerProps {
  variant?: "inline" | "compact" | "card";
  dismissible?: boolean;
}

export default function TelegramBanner({ variant = "inline", dismissible = true }: TelegramBannerProps) {
  return <SocialBanner platform="telegram" variant={variant} dismissible={dismissible} />;
}
