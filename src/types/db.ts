// ─── Tipos del dominio sincronizados con Supabase ─────────────────────────────

export type Perfil = {
  id: string;
  email?: string | null;
  estado: 'pendiente' | 'activo';
  rol: 'admin' | 'cliente';
  created_at: string;
};

export type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  fecha: string;
};

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  valor_unitario: number;
  stock: number;
};

export type Encabezado = {
  id: string;
  id_cliente: string;
  fecha: string;
  total: number;
};

export type Detalle = {
  id: string;
  id_encabezado: string;
  id_producto: string;
  cantidad: number;
  valor: number;
  productos?: Producto;
};

// Tipo para el carrito de compras (estado local)
export type ItemCarrito = {
  producto: Producto;
  cantidad: number;
};

// ─── Database types (para el cliente Supabase tipado) ─────────────────────────
export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil;
        Insert: Partial<Perfil> & { id: string };
        Update: Partial<Perfil>;
      };
      clientes: {
        Row: Cliente;
        Insert: Omit<Cliente, 'fecha'> & { fecha?: string };
        Update: Partial<Cliente>;
      };
      productos: {
        Row: Producto;
        Insert: Omit<Producto, 'id'> & { id?: string };
        Update: Partial<Producto>;
      };
      encabezados: {
        Row: Encabezado;
        Insert: Omit<Encabezado, 'id' | 'fecha'> & { id?: string; fecha?: string };
        Update: Partial<Encabezado>;
      };
      detalles: {
        Row: Detalle;
        Insert: Omit<Detalle, 'id'> & { id?: string };
        Update: Partial<Detalle>;
      };
    };
    Functions: {
      realizar_compra: {
        Args: { p_id_cliente: string; p_items: Array<{ id_producto: string; cantidad: number }> };
        Returns: string;
      };
    };
  };
};
