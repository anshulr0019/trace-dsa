import { libraryLessons, libraryURL } from "@/lib/languages/catalog";
("use client");
import { useEffect } from "react";
import { ArrowUpRight, BookOpen, Code2, Cpu, Gauge, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { lessons } from "@/lib/lessons";
import { problems, patterns } from "@/lib/curriculum/catalog";
import { modules, topics } from "@/lib/computer-science/catalog";

export function QuickSearch({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (url: string) => void;
}) {
  useEffect(() => {
    if (open) window.dispatchEvent(new Event("trace:pause"));
  }, [open]);
  function select(url: string) {
    onOpenChange(false);
    onNavigate(url);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="trace-command-dialog" showCloseButton={false}>
        <DialogTitle className="sr-only">
          Find a lesson or workspace
        </DialogTitle>
        <DialogDescription className="sr-only">
          Search language libraries, algorithms, computer science labs, and
          workspace destinations. Use arrow keys to choose a result and Enter to
          open it.
        </DialogDescription>
        <Command
          filter={(value, search) => {
            const text = value.toLowerCase().replace(/[-_]/g, " ");
            const terms = search
              .toLowerCase()
              .trim()
              .split(/\s+/)
              .filter(Boolean);
            return terms.every((term) => text.includes(term)) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="Where will your curiosity take you?"
            aria-label="Search lessons and workspaces"
          />
          <CommandList>
            <CommandEmpty>
              No matching lesson. Try a pattern like “tree”, “search”, or
              “network”.
            </CommandEmpty>
            <CommandGroup heading="Your workspace">
              {[
                { name: "Home", url: "/", Icon: Home },
                {
                  name: "Learn · guided foundations",
                  url: "/?view=library",
                  Icon: BookOpen,
                },
                {
                  name: "Practice · 100-problem roadmap",
                  url: "/?view=curriculum",
                  Icon: Code2,
                },
                { name: "Computer science labs", url: "/?view=cs", Icon: Cpu },
                { name: "Your progress", url: "/?view=progress", Icon: Gauge },
                {
                  name: "Notebook · saved work",
                  url: "/?view=notebook",
                  Icon: BookOpen,
                },
              ].map(({ name, url, Icon }) => (
                <CommandItem key={url} onSelect={() => select(url)}>
                  <Icon size={16} />
                  {name}
                  <ArrowUpRight className="command-result-arrow" size={14} />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Languages & libraries">
              {libraryLessons.map((l) => (
                <CommandItem
                  key={l.id}
                  value={`language library ${l.language} ${l.language === "cpp" ? "C++ STL" : ""} ${l.title} ${l.syntax.join(" ")}`}
                  onSelect={() => select(libraryURL(l.language, l.topic))}
                >
                  <Code2 size={16} />
                  <span>{l.title}</span>
                  <small>{l.language === "cpp" ? "C++" : l.language}</small>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Guided foundations">
              {lessons.map((l) => (
                <CommandItem
                  key={l.id}
                  value={`foundation ${l.title} ${l.category}`}
                  onSelect={() => select(`/?lesson=${l.id}`)}
                >
                  <BookOpen size={16} />
                  <span>{l.title}</span>
                  <small>Foundation</small>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Algorithm problems">
              {problems.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`problem ${p.title} ${patterns[p.group - 1]}`}
                  onSelect={() => select(`/?view=curriculum&problem=${p.id}`)}
                >
                  <Code2 size={16} />
                  <span>{p.title}</span>
                  <small>{p.stage}</small>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Computer science labs">
              {modules.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`lab ${m.title} ${m.id} ${m.summary} ${topics.find((t) => t.id === m.topic)?.title}`}
                  onSelect={() =>
                    select(`/?view=cs&topic=${m.topic}&module=${m.id}`)
                  }
                >
                  <Cpu size={16} />
                  <span>{m.title}</span>
                  <small>Lab</small>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="command-help">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> to navigate <kbd>↵</kbd> to open
            </span>
            <span>
              <kbd>esc</kbd> to close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
