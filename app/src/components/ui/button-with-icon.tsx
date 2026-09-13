import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonWithIconProps = React.ComponentProps<typeof Link> & {
  className?: string;
};

const ButtonWithIcon = React.forwardRef<HTMLAnchorElement, ButtonWithIconProps>(
  ({ children, className, ...linkProps }, ref) => {
    return (
      <Button
        asChild
        className={cn(
          "relative h-14 w-fit overflow-hidden rounded-full p-1 ps-8 pe-16 text-base font-medium transition-all duration-500 hover:ps-16 hover:pe-8 group",
          className
        )}
      >
        <Link ref={ref} {...linkProps}>
          <span className="relative z-10 transition-all duration-500">{children}</span>
          <span className="absolute right-1 flex h-12 w-12 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-52px)] group-hover:rotate-45">
            <ArrowUpRight size={18} />
          </span>
        </Link>
      </Button>
    );
  }
);
ButtonWithIcon.displayName = "ButtonWithIcon";

export default ButtonWithIcon;
