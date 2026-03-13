export type Artist = {
  id: string;
  name: string;
  bio: string;
  services: string[];
  avatar_url?: string;
};

export type Service = {
  id: string;
  artist_id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  image_url: string | null;
};

export type Booking = {
  id: string;
  customer_id: string;
  artist_id: string;
  service_id: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:MM:SS
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type BookingProduct = {
  booking_id: string;
  product_id: string;
};

// Extended types with relations
export type ServiceWithArtist = Service & {
  artist: Artist;
};

export type BookingWithDetails = Booking & {
  artist: Artist;
  service: Service;
  customer: Customer;
  products?: Product[];
};

export type ArtistWithServices = Artist & {
  services_list: Service[];
};

export type Database = {
  public: {
    Tables: {
      artists: {
        Row: Artist;
        Insert: Omit<Artist, "id"> & { id?: string };
        Update: Partial<Artist>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id"> & { id?: string };
        Update: Partial<Service>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id"> & { id?: string };
        Update: Partial<Booking>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "id"> & { id?: string };
        Update: Partial<Customer>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id"> & { id?: string };
        Update: Partial<Product>;
      };
      booking_products: {
        Row: BookingProduct;
        Insert: BookingProduct;
        Update: Partial<BookingProduct>;
      };
    };
  };
};
