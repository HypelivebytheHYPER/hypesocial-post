import { SidebarNavigation, MobileNavigation } from "@/components/sidebar-nav";
import { PageTransition } from "@/components/page-transition";
import {
  Shell,
  Main,
  Header,
  HeaderLeft,
  HeaderRight,
  Content,
} from "@/components/design-system";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Shell>
      {/* Sidebar Navigation - Desktop */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <Main>
        {/* Header - Mobile Only (Desktop has sidebar) */}
        <Header className="md:hidden">
          <HeaderLeft>
            <span className="text-lg font-bold text-foreground">
              HypePost
            </span>
          </HeaderLeft>
          <HeaderRight>
            {/* Mobile header actions if needed */}
          </HeaderRight>
        </Header>

        {/* Page Content */}
        <Content className="pb-24 md:pb-8">
          <PageTransition>{children}</PageTransition>
        </Content>
      </Main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </Shell>
  );
}
