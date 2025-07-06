'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useAppContext } from '@/context/app-context';
import dynamic from 'next/dynamic';
import type { NodeObject, LinkObject, ForceGraphInstance } from 'react-force-graph';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph').then((mod) => mod.ForceGraph2D), {
  ssr: false,
  loading: () => <p className="text-center p-4">Loading graph...</p>,
});

interface GraphNode extends NodeObject {
  id: string;
  name: string;
  type: 'link' | 'tag';
  url?: string;
  description?: string;
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
}

const tagToHslColor = (tag: string) => {
  let hash = 0;
  if (tag.length === 0) return 'hsl(0, 0%, 80%)';
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
};

export function GraphView() {
  const { links, tags: managedTags } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [container, setContainer] = useState<{width: number, height: number} | null>(null);
  const fgRef = useRef<ForceGraphInstance>();

  const ref = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setContainer({
        width: node.offsetWidth,
        height: node.offsetHeight,
      });
    }
  }, []);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const tagColorMap = useMemo(() => 
    new Map(managedTags.map(t => [t.name, t.color || tagToHslColor(t.name)]))
  , [managedTags]);

  const { graphData, nodeMap } = useMemo(() => {
    if (!isClient) return { graphData: { nodes: [], links: [] }, nodeMap: new Map() };

    const nodes: GraphNode[] = [];
    const localNodeMap = new Map<string, GraphNode>();
    const nodeSet = new Set<string>();
    const graphLinks: GraphLink[] = [];
    const tagSet = new Set<string>();

    links.forEach(link => {
      if (!nodeSet.has(link.id)) {
        const node: GraphNode = {
          id: link.id,
          name: link.title,
          type: 'link',
          url: link.url,
          description: link.description,
        };
        nodes.push(node);
        localNodeMap.set(link.id, node);
        nodeSet.add(link.id);
      }
      
      link.tags.forEach(tag => {
        tagSet.add(tag);
        graphLinks.push({ source: link.id, target: tag });
      });
    });

    tagSet.forEach(tag => {
      if (!nodeSet.has(tag)) {
        const node: GraphNode = {
          id: tag,
          name: `#${tag}`,
          type: 'tag',
        };
        nodes.push(node);
        localNodeMap.set(tag, node);
        nodeSet.add(tag);
      }
    });

    return { graphData: { nodes, links: graphLinks }, nodeMap: localNodeMap };
  }, [links, isClient]);

  if (!isClient) {
    return <p className="text-center p-4">Preparing graph...</p>;
  }

  return (
    <div ref={ref} className="w-full h-[calc(100vh-150px)] bg-card rounded-lg border relative">
      {container && (
        <ForceGraph2D
          ref={fgRef}
          width={container.width}
          height={container.height}
          graphData={graphData}
          nodeLabel={node => {
            const gNode = node as GraphNode;
            if (gNode.type === 'link' && gNode.description) {
              return `<b>${gNode.name}</b><br />${gNode.description}`;
            }
            return gNode.name;
          }}
          onNodeClick={node => {
            const gNode = node as GraphNode;
            if (gNode.type === 'link' && gNode.url) {
              window.open(gNode.url, '_blank', 'noopener,noreferrer');
            }
          }}
          nodeVal={node => (node as GraphNode).type === 'tag' ? 4 : 2}
          nodeColor={node => {
            const gNode = node as GraphNode;
            if (gNode.type === 'tag') {
              return tagColorMap.get(gNode.id) || '#cccccc';
            }
            return 'hsl(var(--muted-foreground))';
          }}
          linkColor={link => {
            const targetNode = nodeMap.get(link.target as string);
            if (targetNode && targetNode.type === 'tag') {
              const color = tagColorMap.get(targetNode.id);
              if (color) {
                // Convert hex to rgba for transparency
                 if (color.startsWith('#')) {
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, 0.3)`;
                }
                return color;
              }
            }
            return 'rgba(128, 128, 128, 0.2)';
          }}
          linkWidth={1}
          backgroundColor="hsl(var(--card))"
          cooldownTicks={100}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 100)}
        />
      )}
    </div>
  );
}
