"use client"

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCartIcon } from 'lucide-react';
import { useCart } from '@/context/cart-context';

export function Header() {
  const { itemCount } = useCart();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" legacyBehavior>
              <a className="flex items-center">
                <Image
                  src="/V4-logo.png"
                  alt="V4 Company Logo"
                  width={150}
                  height={40}
                  priority
                />
              </a>
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/carrinho" legacyBehavior>
              <a className="relative flex items-center p-2 text-gray-600 hover:text-red-600 transition-colors">
                <ShoppingCartIcon className="h-7 w-7" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                    {itemCount}
                  </span>
                )}
              </a>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

