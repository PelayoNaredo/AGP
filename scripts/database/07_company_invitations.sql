-- =====================================================
-- FASE 2 - TAREA 2.5: Sistema de invitaciones
-- Fecha: 8 de agosto de 2025
-- Descripción: Tabla para gestionar invitaciones entre empresas
-- =====================================================

BEGIN;

-- =====================================
-- TABLA: company_invitations
-- =====================================
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invitation_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'rejected')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  invited_email VARCHAR(255),
  created_by_user_id INTEGER REFERENCES public.users(id_usuario),
  used_by_user_id INTEGER REFERENCES public.users(id_usuario),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_id ON public.company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_code ON public.company_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_company_invitations_status ON public.company_invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_company_invitations_expires ON public.company_invitations(expires_at) WHERE status = 'pending';

-- Habilitar RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Crear política RLS
CREATE POLICY "tenant_isolation" ON public.company_invitations
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Verificar creación
SELECT 'company_invitations table created successfully' as status;

COMMIT;

-- Comandos de verificación (ejecutar después del COMMIT)
-- SELECT * FROM company_invitations;
-- SELECT count(*) as invitation_count FROM company_invitations;
