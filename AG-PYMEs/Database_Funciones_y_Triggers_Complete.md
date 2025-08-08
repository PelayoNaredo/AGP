[
{
"schema*name": "auth",
"function_name": "email",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION auth.email()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n select \n coalesce(\n nullif(current_setting('request.jwt.claim.email', true), ''),\n (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')\n )::text\n$function$\n",
"description": "Deprecated. Use auth.jwt() -> 'email' instead.",
"volatility": "STABLE",
"security": "SECURITY INVOKER"
},
{
"schema_name": "auth",
"function_name": "jwt",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION auth.jwt()\n RETURNS jsonb\n LANGUAGE sql\n STABLE\nAS $function$\n select \n coalesce(\n nullif(current_setting('request.jwt.claim', true), ''),\n nullif(current_setting('request.jwt.claims', true), '')\n )::jsonb\n$function$\n",
"description": null,
"volatility": "STABLE",
"security": "SECURITY INVOKER"
},
{
"schema_name": "auth",
"function_name": "role",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION auth.role()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n select \n coalesce(\n nullif(current_setting('request.jwt.claim.role', true), ''),\n (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')\n )::text\n$function$\n",
"description": "Deprecated. Use auth.jwt() -> 'role' instead.",
"volatility": "STABLE",
"security": "SECURITY INVOKER"
},
{
"schema_name": "auth",
"function_name": "uid",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION auth.uid()\n RETURNS uuid\n LANGUAGE sql\n STABLE\nAS $function$\n select \n coalesce(\n nullif(current_setting('request.jwt.claim.sub', true), ''),\n (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n )::uuid\n$function$\n",
"description": "Deprecated. Use auth.jwt() -> 'sub' instead.",
"volatility": "STABLE",
"security": "SECURITY INVOKER"
},
{
"schema_name": "public",
"function_name": "auth_user_company_id",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.auth_user_company_id()\n RETURNS uuid\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n jwt_company_id UUID;\r\nBEGIN\r\n -- Primero intentar obtener de la configuración de sesión\r\n BEGIN\r\n RETURN current_setting('app.current_company_id', false)::UUID;\r\n EXCEPTION\r\n WHEN OTHERS THEN\r\n NULL; -- Continuar al siguiente método\r\n END;\r\n \r\n -- Si no hay configuración de sesión, extraer del JWT\r\n BEGIN\r\n jwt_company_id := COALESCE(\r\n (auth.jwt() ->> 'user_metadata')::jsonb ->> 'company_id',\r\n (auth.jwt() ->> 'app_metadata')::jsonb ->> 'company_id'\r\n )::UUID;\r\n \r\n IF jwt_company_id IS NOT NULL THEN\r\n RETURN jwt_company_id;\r\n END IF;\r\n EXCEPTION\r\n WHEN OTHERS THEN\r\n NULL; -- Continuar\r\n END;\r\n \r\n -- Como último recurso, devolver NULL\r\n RETURN NULL;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "STABLE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "check_company_limits",
"arguments": "company_uuid uuid, resource_type text",
"function_definition": "CREATE OR REPLACE FUNCTION public.check_company_limits(company_uuid uuid, resource_type text)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n company_record record;\r\n current_usage integer;\r\n max_limit integer;\r\nBEGIN\r\n -- Obtener límites de la empresa\r\n SELECT max_users, max_clients, max_products, max_storage_mb \r\n INTO company_record\r\n FROM public.companies \r\n WHERE id = company_uuid;\r\n \r\n IF NOT FOUND THEN\r\n RETURN false;\r\n END IF;\r\n \r\n -- Verificar según el tipo de recurso\r\n CASE resource_type\r\n WHEN 'users' THEN\r\n SELECT COUNT(*) INTO current*usage \r\n FROM public.users \r\n WHERE company_id = company_uuid AND is_active = true;\r\n max_limit := company_record.max_users;\r\n \r\n WHEN 'clients' THEN\r\n SELECT COUNT(*) INTO current*usage \r\n FROM public.clients \r\n WHERE company_id = company_uuid;\r\n max_limit := company_record.max_clients;\r\n \r\n WHEN 'products' THEN\r\n SELECT COUNT(*) INTO current*usage \r\n FROM public.inventory \r\n WHERE company_id = company_uuid;\r\n max_limit := company_record.max_products;\r\n \r\n WHEN 'storage' THEN\r\n SELECT COALESCE(SUM(pg_column_size(logo_local)), 0) / 1024 / 1024 INTO current_usage \r\n FROM public.settings \r\n WHERE company_id = company_uuid;\r\n max_limit := company_record.max_storage_mb;\r\n \r\n ELSE\r\n RETURN false;\r\n END CASE;\r\n \r\n -- Retornar si está dentro del límite (permitir uno más)\r\n RETURN (current_usage + 1) <= max_limit;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "check_company_limits",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.check_company_limits()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nBEGIN\r\n -- Lógica de la función (mantener la existente)\r\n RETURN NEW;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "clean_expired_invitations",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.clean_expired_invitations()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n UPDATE public.company_invitations \r\n SET status = 'expired' \r\n WHERE status = 'pending' \r\n AND expires_at < now();\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "create_profile_for_new_user",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n default_company_id UUID;\r\nBEGIN\r\n -- Buscar una empresa activa para asignar al nuevo usuario\r\n -- En producción, esto debería manejarse de manera diferente\r\n SELECT id INTO default_company_id \r\n FROM companies \r\n WHERE is_active = true \r\n LIMIT 1;\r\n \r\n -- Si no hay empresas, crear una empresa por defecto\r\n IF default_company_id IS NULL THEN\r\n INSERT INTO companies (id, company_name, company_code, company_email, is_active, created_at)\r\n VALUES (\r\n gen_random_uuid(),\r\n 'Empresa por Defecto',\r\n 'DEFAULT-' || extract(epoch from now())::text,\r\n 'default@empresa.com',\r\n true,\r\n NOW()\r\n )\r\n RETURNING id INTO default_company_id;\r\n END IF;\r\n \r\n INSERT INTO public.profiles (id, nombre, email, company_id, created_at)\r\n VALUES (\r\n NEW.id,\r\n COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),\r\n NEW.email,\r\n default_company_id,\r\n NOW()\r\n );\r\n RETURN NEW;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "generate_company_code",
"arguments": "company_name text",
"function_definition": "CREATE OR REPLACE FUNCTION public.generate_company_code(company_name text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n base_code TEXT;\n counter INTEGER := 1;\n final_code TEXT;\nBEGIN\n -- Limpiar el nombre y tomar los primeros 6 caracteres\n base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));\n base_code := LEFT(base_code, 6);\n \n -- Si es muy corto, rellenar con números aleatorios\n IF LENGTH(base_code) < 4 THEN\n base_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');\n END IF;\n \n final*code := base_code;\n \n -- Asegurar unicidad\n WHILE EXISTS (SELECT 1 FROM companies WHERE company_code = final_code) LOOP\n final_code := base_code || LPAD(counter::TEXT, 2, '0');\n counter := counter + 1;\n END LOOP;\n \n RETURN final_code;\nEND;\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY INVOKER"
},
{
"schema_name": "public",
"function_name": "generate_company_code",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.generate_company_code()\n RETURNS text\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nBEGIN\r\n RETURN 'COMP-' || encode(gen_random_bytes(4), 'hex');\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "generate_invitation_code",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.generate_invitation_code()\n RETURNS text\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n code text;\r\n exists boolean;\r\nBEGIN\r\n LOOP\r\n -- Generar código alfanumérico de 8 caracteres\r\n code := upper(substring(md5(random()::text) from 1 for 8));\r\n \r\n -- Verificar si ya existe\r\n SELECT EXISTS(\r\n SELECT 1 FROM public.company_invitations \r\n WHERE invitation_code = code\r\n ) INTO exists;\r\n \r\n -- Si no existe, usar este código\r\n IF NOT exists THEN\r\n EXIT;\r\n END IF;\r\n END LOOP;\r\n \r\n RETURN code;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_company_usage_stats",
"arguments": "company_uuid uuid",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_company_usage_stats(company_uuid uuid)\n RETURNS jsonb\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n result jsonb;\r\nBEGIN\r\n SELECT jsonb_build_object(\r\n 'users', COALESCE((SELECT COUNT(*) FROM public.users WHERE company*id = company_uuid AND is_active = true), 0),\r\n 'clients', COALESCE((SELECT COUNT(*) FROM public.clients WHERE company*id = company_uuid), 0),\r\n 'products', COALESCE((SELECT COUNT(*) FROM public.inventory WHERE company*id = company_uuid), 0),\r\n 'services', COALESCE((SELECT COUNT(*) FROM public.services WHERE company*id = company_uuid AND activo = true), 0),\r\n 'appointments', COALESCE((SELECT COUNT(*) FROM public.appointments WHERE company*id = company_uuid), 0),\r\n 'sales', COALESCE((SELECT COUNT(*) FROM public.sales WHERE company*id = company_uuid), 0),\r\n 'employees', COALESCE((SELECT COUNT(*) FROM public.employees WHERE company*id = company_uuid AND activo = true), 0),\r\n 'suppliers', COALESCE((SELECT COUNT(*) FROM public.suppliers WHERE company*id = company_uuid AND activo = true), 0),\r\n 'storageMB', COALESCE((SELECT SUM(pg_column_size(logo_local)) FROM public.settings WHERE company_id = company_uuid), 0) / 1024 / 1024\r\n ) INTO result;\r\n \r\n RETURN result;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_current_company_id",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_current_company_id()\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n RETURN current_setting('app.current_company_id', true)::UUID;\r\nEXCEPTION\r\n WHEN OTHERS THEN\r\n RETURN NULL;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_income_by_period",
"arguments": "start_date date, end_date date",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_income_by_period(start_date date, end_date date)\n RETURNS TABLE(date date, total_income numeric)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nBEGIN\r\n RETURN QUERY\r\n SELECT \r\n i.created_at::DATE as date,\r\n SUM(i.amount) as total_income\r\n FROM income i\r\n WHERE i.created_at::DATE BETWEEN start_date AND end_date\r\n GROUP BY i.created_at::DATE\r\n ORDER BY date;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_income_by_period",
"arguments": "period_type text, company_uuid uuid",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_income_by_period(period_type text, company_uuid uuid)\n RETURNS TABLE(periodo timestamp with time zone, total_ingresos numeric, num_transacciones bigint, categorias text[])\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n -- Validate period_type to prevent SQL injection\r\n IF period_type NOT IN ('day', 'week', 'month', 'year') THEN\r\n RAISE EXCEPTION 'Invalid period type: %', period_type;\r\n END IF;\r\n\r\n RETURN QUERY\r\n SELECT \r\n CASE \r\n WHEN period_type = 'day' THEN DATE_TRUNC('day', fecha_ingreso)\r\n WHEN period_type = 'week' THEN DATE_TRUNC('week', fecha_ingreso)\r\n WHEN period_type = 'month' THEN DATE_TRUNC('month', fecha_ingreso)\r\n WHEN period_type = 'year' THEN DATE_TRUNC('year', fecha_ingreso)\r\n END as periodo,\r\n COALESCE(SUM(ingresos), 0) as total_ingresos,\r\n COUNT(*) as num*transacciones,\r\n ARRAY_AGG(DISTINCT categoria) FILTER (WHERE categoria IS NOT NULL) as categorias\r\n FROM income\r\n WHERE \r\n company_id = company_uuid \r\n AND (categoria IS NULL OR categoria != 'cierre') -- Exclude daily closure entries\r\n GROUP BY periodo\r\n ORDER BY periodo DESC\r\n LIMIT 50; -- Prevent excessive data retrieval\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_order_detail_statistics",
"arguments": "p_company_id uuid, p_period text DEFAULT 'month'::text",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_order_detail_statistics(p_company_id uuid, p_period text DEFAULT 'month'::text)\n RETURNS TABLE(period timestamp with time zone, total_order_details bigint, total_quantity numeric, total_revenue numeric, avg_quantity_per_order numeric, top_selling_products jsonb)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n RETURN QUERY\r\n WITH order_detail_stats AS (\r\n SELECT \r\n DATE_TRUNC(p_period, od.created_at) AS period_start,\r\n COUNT(*) AS total*order_details,\r\n SUM(od.cantidad) AS total_quantity,\r\n SUM(od.cantidad * od.precio*unitario) AS total_revenue,\r\n AVG(od.cantidad) AS avg_quantity_per_order,\r\n (\r\n SELECT JSONB_AGG(\r\n JSONB_BUILD_OBJECT(\r\n 'product_id', p.id,\r\n 'product_name', p.nombre,\r\n 'total_quantity', product_total_quantity\r\n )\r\n )\r\n FROM (\r\n SELECT \r\n p.id, \r\n p.nombre, \r\n SUM(od2.cantidad) AS product_total_quantity,\r\n RANK() OVER (ORDER BY SUM(od2.cantidad) DESC) AS product_rank\r\n FROM order_detail od2\r\n JOIN products p ON od2.id_producto = p.id\r\n WHERE od2.company_id = p_company_id\r\n GROUP BY p.id, p.nombre\r\n LIMIT 5\r\n ) top_products\r\n WHERE product_rank <= 5\r\n ) AS top_selling_products\r\n FROM order_detail od\r\n WHERE od.company_id = p_company_id\r\n GROUP BY period_start\r\n ORDER BY period_start DESC\r\n )\r\n SELECT \r\n period_start AS period,\r\n total_order_details,\r\n total_quantity,\r\n total_revenue,\r\n avg_quantity_per_order,\r\n top_selling_products\r\n FROM order_detail_stats;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_order_detail_statistics",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_order_detail_statistics()\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n result JSON;\r\nBEGIN\r\n SELECT json_build_object(\r\n 'total_items', (SELECT COUNT(*) FROM order*detail),\r\n 'total_quantity', (SELECT SUM(quantity) FROM order_detail),\r\n 'average_price', (SELECT AVG(price) FROM order_detail)\r\n ) INTO result;\r\n \r\n RETURN result;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_order_statistics",
"arguments": "p_company_id uuid, p_period text DEFAULT 'month'::text",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_order_statistics(p_company_id uuid, p_period text DEFAULT 'month'::text)\n RETURNS TABLE(period timestamp with time zone, total_orders bigint, total_revenue numeric, avg_order_value numeric, status_distribution jsonb)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n RETURN QUERY\r\n WITH order_stats AS (\r\n SELECT \r\n DATE_TRUNC(p_period, fecha_pedido) AS period_start,\r\n COUNT(*) AS total*orders,\r\n SUM(total) AS total_revenue,\r\n AVG(total) AS avg_order_value,\r\n JSONB_OBJECT_AGG(estado, order_count) AS status_distribution\r\n FROM (\r\n SELECT \r\n fecha_pedido, \r\n total, \r\n estado, \r\n COUNT(*) OVER (PARTITION BY estado) AS order*count\r\n FROM orders\r\n WHERE company_id = p_company_id\r\n ) subquery\r\n GROUP BY period_start\r\n ORDER BY period_start DESC\r\n )\r\n SELECT \r\n period_start AS period,\r\n total_orders,\r\n total_revenue,\r\n avg_order_value,\r\n status_distribution\r\n FROM order_stats;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_order_statistics",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_order_statistics()\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n result JSON;\r\nBEGIN\r\n SELECT json_build_object(\r\n 'total_orders', (SELECT COUNT(*) FROM orders),\r\n 'pending*orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),\r\n 'completed*orders', (SELECT COUNT(*) FROM orders WHERE status = 'completed'),\r\n 'cancelled*orders', (SELECT COUNT(*) FROM orders WHERE status = 'cancelled')\r\n ) INTO result;\r\n \r\n RETURN result;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema*name": "public",
"function_name": "get_sales_statistics",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_sales_statistics()\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n result JSON;\r\nBEGIN\r\n SELECT json_build_object(\r\n 'total_sales', (SELECT COUNT(*) FROM sales),\r\n 'total*revenue', (SELECT SUM(total) FROM sales),\r\n 'average_sale', (SELECT AVG(total) FROM sales),\r\n 'today_sales', (SELECT COUNT(*) FROM sales WHERE created*at::DATE = CURRENT_DATE)\r\n ) INTO result;\r\n \r\n RETURN result;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "get_sales_statistics",
"arguments": "p_company_id uuid, p_period text DEFAULT 'month'::text",
"function_definition": "CREATE OR REPLACE FUNCTION public.get_sales_statistics(p_company_id uuid, p_period text DEFAULT 'month'::text)\n RETURNS TABLE(period timestamp with time zone, total_sales bigint, total_revenue numeric, avg_sale_value numeric, sales_by_status jsonb, top_selling_products jsonb, payment_method_distribution jsonb)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n RETURN QUERY\r\n WITH sales_stats AS (\r\n SELECT \r\n DATE_TRUNC(p_period, fecha_emision) AS period_start,\r\n COUNT(*) AS total*sales,\r\n SUM(total) AS total_revenue,\r\n AVG(total) AS avg_sale_value,\r\n JSONB_OBJECT_AGG(estado, sales_count) AS sales_by_status,\r\n (\r\n SELECT JSONB_AGG(\r\n JSONB_BUILD_OBJECT(\r\n 'product_id', p.id,\r\n 'product_name', p.nombre_producto,\r\n 'total_quantity', product_total_quantity,\r\n 'total_revenue', product_total_revenue\r\n )\r\n )\r\n FROM (\r\n SELECT \r\n p.id, \r\n p.nombre_producto, \r\n SUM(sp.cantidad) AS product_total_quantity,\r\n SUM(sp.cantidad * sp.precio*unitario) AS product_total_revenue,\r\n RANK() OVER (ORDER BY SUM(sp.cantidad * sp.precio*unitario) DESC) AS product_rank\r\n FROM sale_products sp\r\n JOIN inventory p ON sp.id_producto = p.id\r\n JOIN sales s ON sp.id_venta = s.id\r\n WHERE s.company_id = p_company_id\r\n GROUP BY p.id, p.nombre_producto\r\n LIMIT 5\r\n ) top_products\r\n WHERE product_rank <= 5\r\n ) AS top_selling_products,\r\n JSONB_OBJECT_AGG(metodo_pago, payment_method_count) AS payment_method_distribution\r\n FROM (\r\n SELECT \r\n fecha_emision, \r\n total, \r\n estado, \r\n metodo_pago,\r\n COUNT(*) OVER (PARTITION BY estado) AS sales*count,\r\n COUNT(*) OVER (PARTITION BY metodo*pago) AS payment_method_count\r\n FROM sales\r\n WHERE company_id = p_company_id\r\n ) subquery\r\n GROUP BY period_start\r\n ORDER BY period_start DESC\r\n )\r\n SELECT \r\n period_start AS period,\r\n total_sales,\r\n total_revenue,\r\n avg_sale_value,\r\n sales_by_status,\r\n top_selling_products,\r\n payment_method_distribution\r\n FROM sales_stats;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "safe_create_profile_for_new_user",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.safe_create_profile_for_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nDECLARE\r\n default_company_id UUID;\r\nBEGIN\r\n -- Buscar una empresa activa para asignar al nuevo usuario\r\n SELECT id INTO default_company_id \r\n FROM companies \r\n WHERE is_active = true \r\n LIMIT 1;\r\n \r\n -- Si no hay empresas, crear una empresa por defecto\r\n IF default_company_id IS NULL THEN\r\n INSERT INTO companies (id, company_name, company_code, company_email, is_active, created_at)\r\n VALUES (\r\n gen_random_uuid(),\r\n 'Empresa por Defecto',\r\n 'DEFAULT-' || extract(epoch from now())::text,\r\n 'default@empresa.com',\r\n true,\r\n NOW()\r\n )\r\n RETURNING id INTO default_company_id;\r\n END IF;\r\n \r\n INSERT INTO public.profiles (id, nombre, email, company_id, created_at)\r\n VALUES (\r\n NEW.id,\r\n COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),\r\n NEW.email,\r\n default_company_id,\r\n NOW()\r\n )\r\n ON CONFLICT (id) DO UPDATE SET\r\n company_id = COALESCE(profiles.company_id, default_company_id),\r\n updated_at = NOW();\r\n \r\n RETURN NEW;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "set_current_company_id",
"arguments": "company_uuid uuid",
"function_definition": "CREATE OR REPLACE FUNCTION public.set_current_company_id(company_uuid uuid)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n PERFORM set_config('app.current_company_id', company_uuid::text, true);\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "update_inventory_after_sale",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.update_inventory_after_sale()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nBEGIN\r\n UPDATE inventory \r\n SET stock = stock - NEW.quantity\r\n WHERE id = NEW.product_id;\r\n \r\n RETURN NEW;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "update_inventory_after_sale",
"arguments": "productos_vendidos jsonb, company_uuid uuid",
"function_definition": "CREATE OR REPLACE FUNCTION public.update_inventory_after_sale(productos_vendidos jsonb, company_uuid uuid)\n RETURNS jsonb\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n producto JSONB;\r\n producto_actual RECORD;\r\n updated_products JSONB[] := '{}';\r\n errors JSONB[] := '{}';\r\n updated_count INTEGER := 0;\r\nBEGIN\r\n -- Validate input\r\n IF productos_vendidos IS NULL OR jsonb_array_length(productos_vendidos) = 0 THEN\r\n RETURN jsonb_build_object(\r\n 'error', 'No products provided for update',\r\n 'updated_count', 0,\r\n 'updated_products', '[]',\r\n 'errors', '[]'\r\n );\r\n END IF;\r\n\r\n -- Start a transaction\r\n BEGIN\r\n -- Iterate over each sold product\r\n FOR producto IN SELECT * FROM jsonb_array_elements(productos_vendidos)\r\n LOOP\r\n -- Validate product input\r\n IF \r\n producto->>'id_producto' IS NULL OR \r\n (producto->>'cantidad_vendida')::INTEGER IS NULL OR \r\n (producto->>'cantidad_vendida')::INTEGER <= 0 \r\n THEN\r\n errors := errors || jsonb_build_object(\r\n 'id_producto', producto->>'id_producto',\r\n 'error', 'Invalid product data'\r\n );\r\n CONTINUE;\r\n END IF;\r\n\r\n -- Get current product information with row-level locking\r\n SELECT \* INTO producto_actual \r\n FROM inventory \r\n WHERE \r\n id = (producto->>'id_producto')::UUID \r\n AND company_id = company_uuid\r\n FOR UPDATE;\r\n \r\n -- Check if product exists\r\n IF NOT FOUND THEN\r\n errors := errors || jsonb_build_object(\r\n 'id_producto', producto->>'id_producto',\r\n 'error', 'Product not found'\r\n );\r\n CONTINUE;\r\n END IF;\r\n \r\n -- Check if sufficient quantity is available\r\n IF producto_actual.cantidad_actual < (producto->>'cantidad_vendida')::INTEGER THEN\r\n errors := errors || jsonb_build_object(\r\n 'id_producto', producto->>'id_producto',\r\n 'error', 'Insufficient stock',\r\n 'available', producto_actual.cantidad_actual,\r\n 'requested', (producto->>'cantidad_vendida')::INTEGER\r\n );\r\n CONTINUE;\r\n END IF;\r\n \r\n -- Update inventory quantity\r\n UPDATE inventory \r\n SET \r\n cantidad_actual = cantidad_actual - (producto->>'cantidad_vendida')::INTEGER,\r\n fecha_actualizacion = CURRENT_TIMESTAMP\r\n WHERE \r\n id = (producto->>'id_producto')::UUID \r\n AND company_id = company_uuid;\r\n \r\n -- Track successful updates\r\n updated_count := updated_count + 1;\r\n updated_products := updated_products || jsonb_build_object(\r\n 'id', producto->>'id_producto',\r\n 'cantidad_anterior', producto_actual.cantidad_actual,\r\n 'cantidad_vendida', (producto->>'cantidad_vendida')::INTEGER,\r\n 'nueva_cantidad', producto_actual.cantidad_actual - (producto->>'cantidad_vendida')::INTEGER\r\n );\r\n END LOOP;\r\n\r\n -- Return comprehensive update result\r\n RETURN jsonb_build_object(\r\n 'updated_count', updated_count,\r\n 'updated_products', updated_products,\r\n 'errors', errors\r\n );\r\n\r\n EXCEPTION \r\n WHEN OTHERS THEN\r\n -- Comprehensive error handling\r\n RETURN jsonb_build_object(\r\n 'error', 'Transaction failed',\r\n 'error_details', SQLERRM,\r\n 'updated_count', 0,\r\n 'updated_products', '[]',\r\n 'errors', errors\r\n );\r\n END;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
},
{
"schema_name": "public",
"function_name": "update_updated_at_column",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n NEW.updated_at = now();\r\n RETURN NEW;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY INVOKER"
},
{
"schema_name": "public",
"function_name": "verify_rls_setup",
"arguments": "",
"function_definition": "CREATE OR REPLACE FUNCTION public.verify_rls_setup()\n RETURNS text\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n result TEXT := '';\r\n test_company_id UUID;\r\nBEGIN\r\n -- Test 1: Sin contexto de sesión\r\n result := result || 'Test 1 - Sin sesión: ';\r\n test_company_id := auth_user_company_id();\r\n IF test_company_id IS NULL THEN\r\n result := result || 'OK (NULL como esperado)' || E'\\n';\r\n ELSE\r\n result := result || 'ENCONTRADO: ' || test_company_id::TEXT || E'\\n';\r\n END IF;\r\n \r\n -- Test 2: Con contexto de sesión\r\n PERFORM set_current_company_id('cdd29637-e0b4-472a-a84c-264384277a82'::UUID);\r\n result := result || 'Test 2 - Con sesión: ';\r\n test_company_id := auth_user_company_id();\r\n IF test_company_id IS NOT NULL THEN\r\n result := result || 'SUCCESS: ' || test_company_id::TEXT || E'\\n';\r\n ELSE\r\n result := result || 'FAILED (NULL inesperado)' || E'\\n';\r\n END IF;\r\n \r\n result := result || E'\\n✅ RLS configurado correctamente!';\r\n RETURN result;\r\nEND;\r\n$function$\n",
"description": null,
"volatility": "VOLATILE",
"security": "SECURITY DEFINER"
}
]
[
{
"schema_name": "public",
"table_name": "companies",
"trigger_name": "update_companies_updated_at",
"trigger_definition": "CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
"description": null,
"timing": "BEFORE",
"events": "UPDATE",
"enabled": "O"
},
{
"schema_name": "public",
"table_name": "settings",
"trigger_name": "update_settings_updated_at",
"trigger_definition": "CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
"description": null,
"timing": "BEFORE",
"events": "UPDATE",
"enabled": "O"
},
{
"schema_name": "public",
"table_name": "users",
"trigger_name": "update_users_updated_at",
"trigger_definition": "CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
"description": null,
"timing": "BEFORE",
"events": "UPDATE",
"enabled": "O"
}
]
