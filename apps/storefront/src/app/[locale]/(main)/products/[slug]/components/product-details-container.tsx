import { Ruler } from "lucide-react";
import { notFound } from "next/navigation";

import { getAccessToken } from "@/auth";
import { CACHE_TTL } from "@/config";
import { clientEnvs } from "@/envs/client";
import { getCheckoutId } from "@/lib/actions/cart";
import { JsonLd, productToJsonLd } from "@/lib/json-ld";
import { paths } from "@/lib/paths";
import { getCurrentRegion } from "@/regions/server";
import { type SupportedLocale } from "@/regions/types";
import { cartService } from "@/services/cart";
import { storefrontLogger } from "@/services/logging";
import { storeService } from "@/services/store";
import { userService } from "@/services/user";

import { Breadcrumbs } from "../../../_components/breadcrumbs";
import { ProductDetails } from "./product-details";

type PageProps = {
  params: Promise<{ locale: SupportedLocale; slug: string }>;
};

const SizeGuide = () => {
  const sizeData = [
    {
      label: "Height, cm",
      S: "150-165",
      M: "165-170",
      L: "170-175",
      XL: "175-180",
      "2XL": "180-185",
      "3XL": "185-190",
      "4XL": "190-195",
    },
    {
      label: "Chest, cm",
      S: "92",
      M: "96",
      L: "100",
      XL: "104",
      "2XL": "108",
      "3XL": "112",
      "4XL": "116",
    },
    {
      label: "Shirt Length, cm",
      S: "64",
      M: "66",
      L: "68",
      XL: "70",
      "2XL": "72",
      "3XL": "74",
      "4XL": "76",
    },
    {
      label: "Sleeve, cm",
      S: "16",
      M: "17",
      L: "18",
      XL: "19",
      "2XL": "20",
      "3XL": "21",
      "4XL": "22",
    },
    {
      label: "Shoulder, cm",
      S: "37",
      M: "40",
      L: "43",
      XL: "44",
      "2XL": "45",
      "3XL": "47",
      "4XL": "49",
    },
  ];

  const sizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

  return (
    <div className="mx-auto mb-12 w-full max-w-6xl px-4">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 md:px-6">
          <div className="flex items-center space-x-3">
            <Ruler className="text-gray-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800 md:text-xl">
              Size Guide
            </h3>
          </div>
          <p className="mt-1 text-xs text-gray-600 md:text-sm">
            Find your perfect fit with our detailed measurements
          </p>
        </div>

        {/* Mobile Card Layout */}
        <div className="block md:hidden">
          {sizes.map((size) => (
            <div
              key={size}
              className="border-b border-gray-100 last:border-b-0"
            >
              <div className="bg-gray-50 px-4 py-3">
                <h4 className="text-center text-lg font-semibold text-gray-800">
                  Size {size}
                </h4>
              </div>
              <div className="space-y-3 px-4 py-3">
                {sizeData.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {row.label}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-900">
                      {row[size as keyof typeof row]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b border-gray-200 px-6 py-4 text-left font-medium text-gray-700">
                  <span className="text-sm uppercase tracking-wide">
                    Measurement
                  </span>
                </th>
                {sizes.map((size) => (
                  <th
                    key={size}
                    className="min-w-[80px] border-b border-gray-200 px-4 py-4 text-center font-semibold text-gray-800"
                  >
                    <span className="text-base">{size}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizeData.map((row, index) => (
                <tr
                  key={row.label}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} transition-colors duration-200 hover:bg-blue-50/30`}
                >
                  <td className="border-b border-gray-100 px-6 py-4 font-medium text-gray-700">
                    {row.label}
                  </td>
                  {sizes.map((size) => (
                    <td
                      key={size}
                      className="border-b border-gray-100 px-4 py-4 text-center text-gray-600"
                    >
                      <span className="inline-block rounded-md bg-white px-2 py-1 text-sm font-medium shadow-sm">
                        {row[size as keyof typeof row]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-blue-50 px-4 py-4 md:px-6">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-xs font-bold text-blue-600">i</span>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-blue-800">
                Sizing Tips
              </p>
              <p className="text-xs leading-relaxed text-blue-700">
                All measurements are in centimeters. For the best fit, measure
                yourself and compare with our size chart. If youre between
                sizes, we recommend sizing up for a more comfortable fit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductDetailsContainer = async (props: PageProps) => {
  const { slug } = await props.params;

  const [region, accessToken, checkoutId] = await Promise.all([
    getCurrentRegion(),
    getAccessToken(),
    getCheckoutId(),
  ]);

  const serviceOpts = {
    channel: region.market.channel,
    languageCode: region.language.code,
    apiURI: clientEnvs.NEXT_PUBLIC_SALEOR_API_URL,
    countryCode: region.market.countryCode,
    logger: storefrontLogger,
  };

  const [{ data }, resultCartGet, resultUserGet] = await Promise.all([
    storeService(serviceOpts).getProductDetails({
      productSlug: slug,
      options: {
        next: {
          revalidate: CACHE_TTL.pdp,
          tags: [`PRODUCT:${slug}`, "DETAIL-PAGE:PRODUCT"],
        },
      },
    }),
    checkoutId
      ? cartService(serviceOpts).cartGet({
          cartId: checkoutId,
          options: {
            next: {
              revalidate: CACHE_TTL.cart,
              tags: [`CHECKOUT:${checkoutId}`],
            },
          },
        })
      : null,
    userService.userGet(accessToken),
  ]);

  if (!data || !data.product) {
    notFound();
  }

  const user = resultUserGet.ok ? resultUserGet.data : null;
  const cart = resultCartGet?.ok ? resultCartGet.data : null;
  const { product, availability } = data;

  const productCrumbs = product.category
    ? [
        {
          label: product.category.name,
          href: paths.search.asPath({
            query: {
              category: product.category.slug,
            },
          }),
        },
      ]
    : undefined;

  console.log("Product crumbs", productCrumbs);

  return (
    <>
      <Breadcrumbs crumbs={productCrumbs} pageName={product.name} />
      <ProductDetails
        product={product}
        availability={availability}
        cart={cart}
        user={user ? { ...user, accessToken } : null}
      />
      <SizeGuide />
      <JsonLd jsonLd={productToJsonLd(data?.product, data?.availability)} />
    </>
  );
};
