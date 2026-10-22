import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Los nadadores son un string[] sin id propio (y hasta pueden estar
// repetidos o vacíos), pero dnd-kit necesita un id estable por
// elemento. Los generamos acá, solo para la UI, sin tocar el modelo
// de datos del store.
let idCounter = 0;
const newId = () => `sw-${++idCounter}`;

interface SwimmerRowProps {
  id: string;
  index: number;
  name: string;
  canRemove: boolean;
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
}

function SortableSwimmerRow({
  id,
  index,
  name,
  canRemove,
  onRename,
  onRemove,
}: SwimmerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        // Solo movimiento vertical: la fila no se va para los costados.
        transform: transform
          ? `translate3d(0, ${transform.y}px, 0)`
          : undefined,
        transition,
        position: "relative",
        zIndex: isDragging ? 2 : undefined,
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        borderRadius: 2,
        bgcolor: isDragging ? "background.paper" : "transparent",
        boxShadow: isDragging ? 6 : 0,
      }}
    >
      <IconButton
        ref={setActivatorNodeRef}
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
        sx={{ touchAction: "none", cursor: "grab" }}
      >
        <DragIndicatorIcon />
      </IconButton>
      <TextField
        fullWidth
        size="small"
        placeholder={`Nadador ${index + 1}`}
        value={name}
        onChange={(e) => onRename(index, e.target.value)}
      />
      <IconButton
        aria-label="Quitar nadador"
        color="error"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
}

interface SwimmerListProps {
  swimmers: string[];
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
}

export default function SwimmerList({
  swimmers,
  onRename,
  onRemove,
  onMove,
}: SwimmerListProps) {
  const [ids, setIds] = useState<string[]>(() => swimmers.map(() => newId()));

  // Si la cantidad de nadadores cambia por fuera de esta lista
  // (agregar uno, cargar lo guardado, reiniciar todo), reacomodamos
  // los ids para que siempre haya uno por nadador.
  useEffect(() => {
    if (ids.length !== swimmers.length) {
      setIds(swimmers.map((_, i) => ids[i] ?? newId()));
    }
  }, [ids, swimmers.length]);

  const renderIds =
    ids.length === swimmers.length
      ? ids
      : swimmers.map((_, i) => ids[i] ?? `tmp-${i}`);

  const sensors = useSensors(
    // 4px de tolerancia: un toque simple en el ícono no arranca un arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = renderIds.indexOf(String(active.id));
    const to = renderIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    setIds(arrayMove(renderIds, from, to));
    onMove(from, to);
  };

  const handleRemove = (index: number) => {
    if (swimmers.length <= 1) return;
    setIds(renderIds.filter((_, k) => k !== index));
    onRemove(index);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={renderIds} strategy={verticalListSortingStrategy}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {swimmers.map((name, j) => (
            <SortableSwimmerRow
              key={renderIds[j]}
              id={renderIds[j]}
              index={j}
              name={name}
              canRemove={swimmers.length > 1}
              onRename={onRename}
              onRemove={handleRemove}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
}
