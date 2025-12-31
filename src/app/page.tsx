'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Folder,
  Settings,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

const practiceDomains = [
  {
    title: 'Information and Ideas',
    accuracy: 75,
    subTopics: [
      'Central ideas and details',
      'Command of evidence: textual',
      'Command of evidence: quantitative',
      'Inferences',
    ],
  },
  {
    title: 'Craft and Structure',
    accuracy: 50,
    subTopics: [
      'Words in context',
      'Text structure and purpose',
      'Cross-text connections',
    ],
  },
  {
    title: 'Expression of Ideas',
    accuracy: 90,
    subTopics: [
      'Rhetorical synthesis',
      'Transitions',
    ],
  },
  {
    title: 'Standard English Conventions',
    accuracy: 65,
    subTopics: [
      'Boundaries',
      'Form, structure, and sense',
    ],
  },
];

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
             <div className="group-data-[collapsible=icon]:hidden">
                <Select defaultValue="sat">
                <SelectTrigger className="w-[180px] bg-sidebar-accent border-sidebar-border focus:ring-sidebar-ring">
                    <SelectValue placeholder="Select a test" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="sat">SAT</SelectItem>
                    <SelectItem value="act">ACT</SelectItem>
                    <SelectItem value="ap">AP Classes</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Practice" href="#">
                <ClipboardList />
                <span>Practice</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Mock Exams" href="#">
                <ClipboardCheck />
                <span>Mock Exams</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Study Plan" href="#">
                <BookOpen />
                <span>Study Plan</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Performance" href="#">
                <BarChart />
                <span>Performance</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Resources" href="#">
                <Folder />
                <span>Resources</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-6 md:p-8">
            <h1 className="text-2xl font-bold mb-1 text-foreground">Targeted Practice by Domain</h1>
            <p className="text-muted-foreground mb-6">Based on your mock exam performance</p>

            <div className="grid gap-6 md:grid-cols-2">
                {practiceDomains.map((domain) => (
                    <Card key={domain.title} className="bg-card/70 border-primary/20 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-lg">{domain.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center mb-4">
                                <Progress value={domain.accuracy} className="h-2 flex-1" />
                                <span className="ml-4 text-sm font-medium text-muted-foreground">{domain.accuracy}%</span>
                            </div>
                            <div className="border-t border-border pt-4">
                                <ul className="space-y-2">
                                    {domain.subTopics.map((topic) => (
                                        <li key={topic}>
                                            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                {topic}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
