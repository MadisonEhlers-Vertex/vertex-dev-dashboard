/* @jsx jsx */ /** @jsxRuntime classic */ import { jsx } from "@emotion/react";
import { vertexvis } from "@vertexvis/frame-streaming-protos";
import { TapEventDetails } from "@vertexvis/viewer/dist/types/interactions/tapEventDetails";
import {
  JSX as ViewerJSX,
  VertexViewer,
  VertexViewerToolbar,
  VertexViewerViewCube,
} from "@vertexvis/viewer-react";
import React from "react";

import { StreamCredentials } from "../lib/config";
import { ViewerSpeedDial } from "./ViewerSpeedDial";

interface ViewerProps extends ViewerJSX.VertexViewer {
  readonly credentials: StreamCredentials;
  readonly viewer: React.MutableRefObject<HTMLVertexViewerElement | null>;
  readonly viewerId: string;
}

export interface Action {
  readonly icon: React.ReactNode;
  readonly name: string;
  readonly onClick: () => void;
}

type ViewerComponentType = React.ComponentType<
  ViewerProps & React.RefAttributes<HTMLVertexViewerElement>
>;

type HOCViewerProps = React.RefAttributes<HTMLVertexViewerElement>;

interface OnSelectProps extends HOCViewerProps {
  readonly onSelect: (hit?: vertexvis.protobuf.stream.IHit) => Promise<void>;
}

export const AnimationDurationMs = 1500;
export const Viewer = onTap(UnwrappedViewer);

function UnwrappedViewer({
  credentials,
  viewer,
  viewerId,
  ...props
}: ViewerProps): JSX.Element {
  return (
    <VertexViewer
      configEnv={credentials.vertexEnv}
      css={{ height: "100%", width: "100%" }}
      clientId={credentials.clientId}
      id={viewerId}
      ref={viewer}
      src={`urn:vertexvis:stream-key:${credentials.streamKey}`}
      {...props}
    >
      <VertexViewerToolbar placement="top-right">
        <VertexViewerViewCube
          animationDuration={AnimationDurationMs}
          viewer={viewer.current ?? undefined}
        />
      </VertexViewerToolbar>
      <VertexViewerToolbar placement="bottom-right">
        <ViewerSpeedDial viewer={viewer} />
      </VertexViewerToolbar>
    </VertexViewer>
  );
}

function onTap<P extends ViewerProps>(
  WrappedViewer: ViewerComponentType
): React.FunctionComponent<P & OnSelectProps> {
  return function Component({ viewer, onSelect, ...props }: P & OnSelectProps) {
    async function handleTap(e: CustomEvent<TapEventDetails>) {
      if (props.onTap) props.onTap(e);

      if (!e.defaultPrevented) {
        const scene = await viewer.current?.scene();
        const raycaster = scene?.raycaster();

        if (raycaster != null) {
          const res = await raycaster.hitItems(e.detail.position, {
            includeMetadata: true,
          });
          const hit = (res?.hits ?? [])[0];
          await onSelect(hit);
        }
      }
    }

    return <WrappedViewer viewer={viewer} {...props} onTap={handleTap} />;
  };
}
