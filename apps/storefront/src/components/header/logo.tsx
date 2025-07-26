"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import BrandLogo from "@/assets/logo.png";
import { Link } from "@/i18n/routing";
import { paths } from "@/lib/paths";

export const Logo = () => {
  const t = useTranslations("common");

  return (
    <Link
      href={paths.home.asPath()}
      title={t("go-to-homepage")}
      aria-label={t("logo")}
    >
      <Image src={BrandLogo} alt={t("logo")} height={36} />
    </Link>
  );
};

Logo.displayName = "Logo";
