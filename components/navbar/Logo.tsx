"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {};

function Logo({ }: Props) {
  return (
    <Link href="/">
      <Image
        alt="logo"
        className="hidden md:block cursor-pointer"
        height="100"
        width="100"
        src="/assets/logo.png"
      />
    </Link>
  );
}

export default Logo;
