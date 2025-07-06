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
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
}

export function GraphView() {
  const { links } = useAppContext();
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

  const graphData = useMemo(() => {
    if (!isClient) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const nodeSet = new Set<string>();
    const graphLinks: GraphLink[] = [];
    const tagSet = new Set<string>();

    links.forEach(link => {
      if (!nodeSet.has(link.id)) {
        nodes.push({
          id: link.id,
          name: link.title,
          type: 'link',
        });
        nodeSet.add(link.id);
      }
      
      link.tags.forEach(tag => {
        tagSet.add(tag);
        graphLinks.push({ source: link.id, target: tag });
      });
    });

    tagSet.forEach(tag => {
      if (!nodeSet.has(tag)) {
        nodes.push({
          id: tag,
          name: `#${tag}`,
          type: 'tag',
        });
        nodeSet.add(tag);
      }
    });

    return { nodes, links: graphLinks };
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
          nodeLabel="name"
          nodeVal={node => (node as GraphNode).type === 'tag' ? 4 : 1}
          nodeColor={node => (node as GraphNode).type === 'tag' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
          linkColor={() => 'hsl(var(--border))'}
          linkWidth={0.5}
          backgroundColor="hsl(var(--card))"
          cooldownTicks={100}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 100)}
        />
      )}
    </div>
  );
}
