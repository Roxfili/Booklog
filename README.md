A custom HTML dashboard designed to bridge the gap between social media discovery and actual reading. BookLog provides a dedicated space to organize and track those 'TBR' book recommendation videos that often get lost in social media folders, transforming saved links into a curated personal library.

## The Problem
I'm very very lazy and so i add thousands of reels on instagram folders names 'read later' or 'tbr' or 'want to read' and then completely forget about them. **BookLog** is my easy manual solution to finally give those links a home, transforming saved videos into an organized TBR (To Be Read) list or concrete reviews.

## Features
* **TBR Management:** A dedicated space to paste those bookish links that would otherwise get lost in the "saved" folders.
* **Podium View:** A special showcase for the "Top 3" books of the year with a custom-built podium.
* **Year review** A sum up of the reading year, showing also a favourite book for each month.

## Tech Stack
* **HTML5 / CSS3:** The entire UI is handcrafted without external UI frameworks. It features a fully responsive layout and custom-themed components.
* **Development Environment:** Powered by Node.js and Vite. This setup enables fast Hot Module Replacement, secure environment variable handling, and an optimized build process.
* **Backend & Auth:** Integrated with Supabase (PostgreSQL) for real-time database management and secure user authentication.
* **FontAwesome:** For social media icons and the rating system.
* **Google Fonts:** Using editorial fonts.

## DB config
> **Note:** To set up the database, run the following SQL script in your Supabase SQL Editor. It will create the necessary tables and relationships.

create table public."Books" (
  title character varying not null,
  author character varying not null,
  length character varying null,
  saga character varying null,
  serie_position smallint null,
  status boolean null,
  cover_link character varying null,
  "ID" uuid not null default gen_random_uuid (),
  genre character varying null,
  tropes text null,
  constraint Books_pkey primary key ("ID")
) TABLESPACE pg_default;

create table public."Monthly_Favourites" (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  book_id uuid null default gen_random_uuid (),
  month integer not null,
  year bigint not null,
  constraint Monthly_Favourites_pkey primary key (id),
  constraint Monthly_Favourites_book_id_fkey foreign KEY (book_id) references "Books" ("ID") on update CASCADE on delete CASCADE,
  constraint Monthly_Favourites_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create table public."Purchase" (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  book_id uuid null default gen_random_uuid (),
  price real null,
  shop_date date null,
  title character varying null,
  constraint Purchase_pkey primary key (id),
  constraint Purchase_book_id_fkey foreign KEY (book_id) references "Books" ("ID") on update CASCADE on delete CASCADE,
  constraint Purchase_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE
) TABLESPACE pg_default;

create table public."Read" (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  book_id uuid null default gen_random_uuid (),
  start_date date null,
  finish_date date not null,
  stars real null,
  is_from_tbr boolean null default false,
  constraint Read_pkey primary key (id),
  constraint Read_book_id_fkey foreign KEY (book_id) references "Books" ("ID") on update CASCADE on delete CASCADE,
  constraint Read_bser_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE,
  constraint date_check check ((start_date <= finish_date)),
  constraint stars_range_check check (
    (
      (stars >= (0)::double precision)
      and (stars <= (5)::double precision)
    )
  )
) TABLESPACE pg_default;

create table public."TBR" (
  link character varying null,
  add_date date null,
  "ID" uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  book_id uuid not null default gen_random_uuid (),
  constraint TBR_pkey primary key ("ID"),
  constraint TBR_book_id_fkey foreign KEY (book_id) references "Books" ("ID") on update CASCADE on delete CASCADE,
  constraint TBR_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE
) TABLESPACE pg_default;

create table public."Top_3_Year" (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  book_id uuid not null default gen_random_uuid (),
  rank integer null,
  year integer null,
  constraint Top_3_Year_pkey primary key (id),
  constraint Top_3_Year_book_id_key unique (book_id),
  constraint Top_3_Year_book_id_fkey foreign KEY (book_id) references "Books" ("ID") on update CASCADE on delete CASCADE,
  constraint Top_3_Year_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

## How to install & run
1. **Clone** the repo:  
   `git clone https://github.com/Roxfili/booklog.git`
2. **Install dependencies**:  
   Navigate to the folder and run: `npm install`
3. **Set up your environment**:  
   Create a `.env` file in the root folder and add your Supabase credentials:
   ```text
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_KEY=your_supabase_anon_key_here
4. **Run the app**:
    Start the development server: npx vite
    Open the link provided in the terminal (usually http://localhost:5173)

## Future Features
I'm constantly working to make BookLog more intuitive. Planned updates include:
* **Advanced Statistics:** Visual charts to see your most read genres and monthly reading pace.
* **Automatic Cover Fetching:** Integration with OpenLibrary API to automatically find book covers by title or ISBN.
* **Reading Challenges:** A progress tracker for your yearly reading goals.
* **Full Reviews:** I'm lazy and never write reviews.I'm successfully procrastinating this feature for as long as possible, but it might eventually show up.

## Credits & Goals
This project was born from a personal need to organize my "BookTok" chaos. It's a work-in-progress journey into modern web development, focusing on clean UI and efficient database management.
If it sucks, i'm sorry, i'm tired.

---
**Made with insomnia by me <3**
