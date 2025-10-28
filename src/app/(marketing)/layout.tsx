// src/app/(marketing)/layout.tsx

import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* NOTE: Navbar now includes Terms / Privacy links (desktop+mobile) */}
      <Navbar />

      {/* main marketing content */}
      <main className="flex-1">{children}</main>

      {/* NOTE: Footer also shows Terms / Privacy at the bottom of every marketing page */}
      <Footer />
    </div>
  );
}



// // src/app/(marketing)/layout.tsx
// import Navbar from "@/components/marketing/Navbar";
// import Footer from "@/components/marketing/Footer";

// export default function MarketingLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="min-h-screen flex flex-col">
//       <Navbar />
//       <main className="flex-1">{children}</main>
//       <Footer />
//     </div>
//   );
// }
