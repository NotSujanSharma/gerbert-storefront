## 🎥 Demo

<https://github.com/user-attachments/assets/373825cf-a4fc-4123-86eb-639c4c40d96f>

## 🚀 Features

- **Headless Architecture:** Gerbert-storefront's headless architecture provides a flexible, easy-to-maintain, and ready-to-deploy solution for online businesses.

- **Next.js 15:** App router, React Server Components (RSC), Server Actions, Caching and Static Site Generation (SSG) support with Typescript setup.

- **Shadcn UI/Tailwind CSS:** Gerbert-storefront's UI uses [Shadcn UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/), providing a modern and customizable design system.

- **Turborepo:** Gerbert-storefront's monorepo is powered by [Turborepo](https://turbo.build/repo/docs/getting-started/introduction), a fast and scalable build system for monorepos. Automated tests with [Playwright](https://playwright.dev/) and setup for [Docs](https://nextra.site/) are included.

- **Stripe Integration:** Gerbert-storefront's storefront uses Stripe [Payment Element](https://docs.stripe.com/payments/payment-element) for secure payment processing.

- **Customizable infrastructure:** Gerbert-storefront's infrastructure is highly customizable, allowing you to tailor it to your specific needs and requirements. Extend it by providing the setup to any third-party service.

- **Tooling included:** Comes with ESLint, Prettier, Husky, Lint Staged, and Codegen preconfigured.

## 🔧 Prerequisites

This project uses [pnpm](https://pnpm.io/installation) and [Turborepo](https://turbo.build/repo/docs/installing), so make sure you have them installed globally in your system:

```bash
npm install -g pnpm
```

```bash
pnpm install turbo --global
```

## ⚡ Quickstart

Clone this repository and copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` file and provide required variables.

Then, [install `pnpm`](https://pnpm.io/installation) and run the following command to install all dependencies in the repo:

```bash
pnpm i
```

To start just the development server for storefront, run this

```bash
pnpm run dev:storefront
```

To generate a new types, run this:

```bash
pnpm run codegen
```

The app is now running at `http://localhost:3000`.

