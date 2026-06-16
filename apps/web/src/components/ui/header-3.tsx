'use client';
import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LucideIcon } from 'lucide-react';
import {
	CodeIcon,
	GlobeIcon,
	LayersIcon,
	UserPlusIcon,
	Users,
	Star,
	FileText,
	Shield,
	RotateCcw,
	Handshake,
	Leaf,
	HelpCircle,
	BarChart,
	PlugIcon,
    Sun,
    Moon,
    User as UserIcon,
} from 'lucide-react';

type LinkItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	description?: string;
};

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);
    const { theme, setTheme } = useTheme();
	const [user, setUser] = React.useState<User | null>(null);
	const [authLoaded, setAuthLoaded] = React.useState(false);
	const [avatarError, setAvatarError] = React.useState(false);

	React.useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setAuthLoaded(true);
		});
		return () => unsubscribe();
	}, []);

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn('sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-transparent transition-all duration-300', {
				'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border/50 backdrop-blur-xl shadow-lg':
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<div className="flex items-center gap-5">
					<a href="#" className="hover:bg-accent/50 rounded-lg p-2 flex items-center gap-3 transition-colors">
                        <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05)]">
                            <Shield className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                        </div>
						<span className="font-display font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-orange-500">
                            ForgeGuard
                        </span>
					</a>
					<div className="hidden md:flex items-center gap-2">
						<Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover:bg-accent rounded-md">
							Pricing
						</Link>
					</div>
				</div>
				<div className="hidden items-center gap-3 md:flex">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl bg-background/50 backdrop-blur-md border-border/50 hover:bg-accent shadow-sm"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
					{authLoaded && user ? (
						<Button asChild variant="outline" size="icon" className="rounded-xl shadow-[0_0_15px_rgba(234,88,12,0.3)] border-border/50 bg-background/50 backdrop-blur-md hover:bg-accent overflow-hidden p-0">
							<Link href="/orchestration">
								{user?.photoURL && !avatarError ? (
									<img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} referrerPolicy="no-referrer" />
								) : (
									<UserIcon className="w-5 h-5 text-foreground" />
								)}
								<span className="sr-only">Dashboard</span>
							</Link>
						</Button>
					) : (
						<>
							<Button asChild variant="outline" className="rounded-xl">
								<Link href="/sign-in">Sign In</Link>
							</Button>
							<Button asChild className="rounded-xl shadow-[0_0_15px_rgba(234,88,12,0.3)]">
								<Link href="/sign-up">Get Started</Link>
							</Button>
						</>
					)}
				</div>
				<Button
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					className="md:hidden"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>
			<MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
				<div className="flex w-full flex-col gap-y-2">
					<Link href="/pricing" className="text-sm font-medium text-foreground hover:bg-accent p-3 rounded-md transition-colors border border-transparent hover:border-border">
						Pricing
					</Link>
				</div>
				<div className="flex flex-col gap-2">
					{authLoaded && user ? (
						<Button asChild className="w-full gap-2">
							<Link href="/orchestration">
								<div className="w-5 h-5 rounded-full overflow-hidden border border-primary/20 flex items-center justify-center shrink-0">
									{user?.photoURL && !avatarError ? (
										<img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} referrerPolicy="no-referrer" />
									) : (
										<UserIcon className="w-3 h-3 text-primary-foreground" />
									)}
								</div>
								Dashboard
							</Link>
						</Button>
					) : (
						<>
							<Button asChild variant="outline" className="w-full bg-transparent">
								<Link href="/sign-in">Sign In</Link>
							</Button>
							<Button asChild className="w-full">
								<Link href="/sign-up">Get Started</Link>
							</Button>
						</>
					)}
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-xl',
				'fixed top-[88px] right-4 bottom-4 left-4 z-40 flex flex-col overflow-hidden border border-border/50 rounded-2xl md:hidden shadow-2xl',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
					'size-full p-4',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}

function ListItem({
	title,
	description,
	icon: Icon,
	className,
	href,
	...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
	return (
		<NavigationMenuLink className={cn('w-full flex flex-row gap-x-2 data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-sm p-2', className)} {...props} asChild>
			<a href={href}>
				<div className="bg-background/40 flex aspect-square size-12 items-center justify-center rounded-md border shadow-sm">
					<Icon className="text-foreground size-5" />
				</div>
				<div className="flex flex-col items-start justify-center">
					<span className="font-medium">{title}</span>
					<span className="text-muted-foreground text-xs">{description}</span>
				</div>
			</a>
		</NavigationMenuLink>
	);
}

const productLinks: LinkItem[] = [
	{
		title: 'AI Audits',
		href: '#',
		description: 'Scan Firebase rules with AI',
		icon: Shield,
	},
	{
		title: 'Cloud Platform',
		href: '#',
		description: 'Deploy and scale apps in the cloud',
		icon: LayersIcon,
	},
	{
		title: 'Team Collaboration',
		href: '#',
		description: 'Tools to help your teams work better together',
		icon: UserPlusIcon,
	},
	{
		title: 'Analytics',
		href: '#',
		description: 'Track and analyze your security traffic',
		icon: BarChart,
	},
	{
		title: 'Integrations',
		href: '#',
		description: 'Connect your apps and services',
		icon: PlugIcon,
	},
	{
		title: 'API',
		href: '#',
		description: 'Build custom integrations with our API',
		icon: CodeIcon,
	},
];

const companyLinks: LinkItem[] = [
	{
		title: 'About Us',
		href: '#',
		description: 'Learn more about our story and team',
		icon: Users,
	},
	{
		title: 'Customer Stories',
		href: '#',
		description: 'See how we’ve helped our clients succeed',
		icon: Star,
	},
	{
		title: 'Partnerships',
		href: '#',
		icon: Handshake,
		description: 'Collaborate with us for mutual growth',
	},
];

const companyLinks2: LinkItem[] = [
	{
		title: 'Terms of Service',
		href: '#',
		icon: FileText,
	},
	{
		title: 'Privacy Policy',
		href: '#',
		icon: Shield,
	},
	{
		title: 'Refund Policy',
		href: '#',
		icon: RotateCcw,
	},
	{
		title: 'Blog',
		href: '#',
		icon: Leaf,
	},
	{
		title: 'Help Center',
		href: '#',
		icon: HelpCircle,
	},
];


function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	// also check on first load
	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}
