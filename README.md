# Casa8 Property Management Platform

This is a full-stack property management web application built with Next.js, TypeScript, Supabase, and Tailwind CSS. It connects landlords and tenants, allowing them to manage properties and rental applications.

## Core Technologies

- **Framework**: [Next.js 15](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [Supabase](https://supabase.io/) (Database, Auth, Storage, Realtime)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## Features

### For Tenants
- **Search**: Find properties with filters for location, price, type, and amenities.
- **Map View**: Visualize property locations on a map.
- **Favorites**: Save properties to a personal list.
- **Apply**: Submit rental applications directly through the platform.
- **Messaging**: Communicate with landlords in real-time.

### For Landlords
- **Property Management**: List, edit, and delete properties.
- **Image Uploads**: Upload multiple images for each property.
- **Application Management**: Review and manage rental applications.
- **Dashboard**: View all listed properties and their statuses.
- **Messaging**: Communicate with tenants in real-time.

### Admin
- **User Management**: View and manage all users.
- **Property Management**: View and manage all properties.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/justingrant1/casa8v3.git
   cd casa8v3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root of the project and add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The database is managed with Supabase. The schema includes the following tables:

- `profiles`: Extends `auth.users` to store user profiles and roles.
- `properties`: Stores all property listings.
- `applications`: Manages rental applications.
- `favorites`: Tracks users' favorite properties.
- `messages`: Stores real-time chat messages.

For detailed schema, see the [SQL file](path/to/your/schema.sql).

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com/). Simply connect your GitHub repository to Vercel and it will automatically deploy the application.
