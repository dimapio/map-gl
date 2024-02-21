import React from "react";
import { createPortal } from "react-dom";
import mapboxgl from "mapbox-gl";
import { useMapEvent } from "@/hooks";
import { PopupEvent } from "@/types";
import { useInnerMap } from "./Map";

const DefaultPopupOptions: Partial<mapboxgl.PopupOptions> = {
	closeButton: false,
};
type ClickPopupProps = {
	layerId: string;
	options?: Partial<mapboxgl.PopupOptions>;
	children: (e: PopupEvent) => React.ReactNode;
};
const ClickPopup: React.FC<ClickPopupProps> = ({
	layerId,
	options,
	children,
}) => {
	const map = useInnerMap();
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const [event, setEvent] = React.useState<PopupEvent | null>(null);

	React.useEffect(() => {
		containerRef.current = document.createElement("div");
	}, []);
	useMapEvent({
		map,
		type: "click",
		layerId,
		callback: (e) => {
			if (!containerRef.current) return;
			if (!map) return;
			const features = e.features || [];
			if (!features.length) return;
			const popup = new mapboxgl.Popup({ ...DefaultPopupOptions, ...options });
			popup.setDOMContent(containerRef.current);
			popup.setLngLat(e.lngLat);
			popup.addTo(map);
			setEvent({ features, lngLat: e.lngLat, point: e.point });
		},
	});
	if (!containerRef.current) return null;
	if (!event) return null;
	return createPortal(children(event), containerRef.current);
};

export default ClickPopup;