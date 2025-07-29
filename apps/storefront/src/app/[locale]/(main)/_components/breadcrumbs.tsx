import { getTranslations } from "next-intl/server";
import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@nimara/ui/components/breadcrumb";

import { Link } from "@/i18n/routing";
import { paths } from "@/lib/paths";

export const Breadcrumbs = async ({
  crumbs,
  pageName,
}: {
  crumbs?: { href: string; label: string }[];
  pageName?: string;
}) => {
  const t = await getTranslations("home");

  return (
    <div className="hidden md:block">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href={paths.home.asPath()}>{t("home")}</Link>
          </BreadcrumbItem>
          {(pageName || crumbs) && <BreadcrumbSeparator />}

          {crumbs &&
            crumbs.map((crumb) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            ))}
          {pageName && (
            <BreadcrumbItem>
              <BreadcrumbPage>{pageName}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
