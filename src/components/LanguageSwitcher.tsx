import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border/50 rounded-xl">
        <DropdownMenuItem 
          onClick={() => changeLanguage("fr")}
          className={i18n.language === "fr" ? "text-primary font-bold" : ""}
        >
          Français
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage("en")}
          className={i18n.language === "en" ? "text-primary font-bold" : ""}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
