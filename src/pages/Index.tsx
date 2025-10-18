import DashboardPage from "./DashboardPage";
import { ArticlePage } from "./ArticlePage";
import { ReportsPage } from "./ReportsPage";
import { useUIStore } from "@/store/uiStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div className="w-full">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-3 h-12 sm:h-14 bg-card/50 border border-border mb-6">
            <TabsTrigger value="forecast-all" className="text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">📊 Forecast All</span>
              <span className="sm:hidden">📊 All</span>
            </TabsTrigger>
            <TabsTrigger value="single-article" className="text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">🔎 Single Article</span>
              <span className="sm:hidden">🔎 Single</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">📋 Reports</span>
              <span className="sm:hidden">📋 Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast-all" className="mt-0">
            <DashboardPage />
          </TabsContent>

          <TabsContent value="single-article" className="mt-0">
            <ArticlePage />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
