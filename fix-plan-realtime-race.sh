#!/usr/bin/env bash
#
# fix-plan-realtime-race.sh
# Aplica a correcao do bug Realtime direto na main.
# Rode na RAIZ do repositorio, dentro do Codespace.
#
set -euo pipefail

if [ ! -f package.json ] || [ ! -d src ]; then
  echo "❌ Rode na raiz do repositorio (onde esta package.json)."
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Ha mudancas nao commitadas. Faca commit ou 'git stash' antes."
  exit 1
fi

echo "▶ Atualizando main..."
git fetch origin main
git checkout main
git pull origin main

echo "▶ Gravando patch..."
cat > /tmp/fix-plan-realtime-race.patch <<'PATCH_EOF'
diff --git a/src/pages/trainer/PlanBuilderPage.tsx b/src/pages/trainer/PlanBuilderPage.tsx
index 8d0b0ae..11842ee 100644
--- a/src/pages/trainer/PlanBuilderPage.tsx
+++ b/src/pages/trainer/PlanBuilderPage.tsx
@@ -149,6 +149,8 @@ export default function PlanBuilderPage() {
           description: planDesc.trim() || null,
           student_id: isTemplate ? null : studentId,
           is_template: isTemplate,
+          // Esconde a ficha enquanto recria os dias/exercícios (evita Realtime com ficha vazia)
+          is_active: false,
         }).eq('id', planId);
         if (planError) throw planError;
         resolvedPlanId = planId;
@@ -165,7 +167,8 @@ export default function PlanBuilderPage() {
           student_id: isTemplate ? null : studentId,
           name: planName.trim(),
           description: planDesc.trim() || null,
-          is_active: true,
+          // Cria inativa; ativa só no final, com dias/exercícios já inseridos
+          is_active: false,
           is_template: isTemplate,
         }).select('id').single();
         if (planError || !plan) throw planError ?? new Error('Falha ao criar ficha');
@@ -218,9 +221,22 @@ export default function PlanBuilderPage() {
         }
       }

+      // Ativa a ficha agora que todos os dias/exercícios existem.
+      // É este passo que o app do aluno recebe via Realtime, já com a ficha pronta.
+      const { error: activateError } = await supabase
+        .from('workout_plans')
+        .update({ is_active: true })
+        .eq('id', resolvedPlanId);
+      if (activateError) throw activateError;
+
       toast.success(isEdit ? 'Ficha atualizada!' : 'Ficha criada com sucesso!');
       navigate('/trainer');
     } catch (err: any) {
+      // Em edição, se algo falhou no meio, restaura a visibilidade da ficha
+      // que o aluno já tinha (não deixa o aluno sem ficha por causa do erro).
+      if (isEdit && planId) {
+        await supabase.from('workout_plans').update({ is_active: true }).eq('id', planId);
+      }
       toast.error('Erro ao salvar: ' + (err?.message ?? 'Tente novamente'));
     } finally {
       setSaving(false);
diff --git a/src/pages/trainer/TrainerDashboard.tsx b/src/pages/trainer/TrainerDashboard.tsx
index c198893..beeeb4f 100644
--- a/src/pages/trainer/TrainerDashboard.tsx
+++ b/src/pages/trainer/TrainerDashboard.tsx
@@ -134,7 +134,8 @@ export default function TrainerDashboard() {
         student_id: assignStudentId,
         name: assigningTemplate.name,
         description: assigningTemplate.description,
-        is_active: true,
+        // Cria inativa; só ativa depois de copiar dias/exercícios (evita Realtime com ficha vazia)
+        is_active: false,
         is_template: false,
       })
       .select()
@@ -200,6 +201,18 @@ export default function TrainerDashboard() {
       }
     }

+    // Agora que a ficha está completa (dias + exercícios), ativa para o aluno.
+    // Este UPDATE é o que dispara o Realtime no app do aluno, já com a ficha pronta.
+    const { error: activateErr } = await supabase
+      .from('workout_plans')
+      .update({ is_active: true })
+      .eq('id', newPlan.id);
+    if (activateErr) {
+      toast.error('Erro ao ativar a ficha');
+      setAssigning(false);
+      return;
+    }
+
     toast.success('Ficha atribuída com sucesso!');
     setAssigningTemplate(null);
     setAssignStudentId("");
PATCH_EOF

echo "▶ Aplicando patch..."
if git apply --check /tmp/fix-plan-realtime-race.patch 2>/dev/null; then
  git apply /tmp/fix-plan-realtime-race.patch
else
  echo "⚠️ Contexto divergente; tentando merge de 3 vias..."
  git apply --3way /tmp/fix-plan-realtime-race.patch
fi

echo "▶ Commit..."
git add src/pages/trainer/TrainerDashboard.tsx src/pages/trainer/PlanBuilderPage.tsx
git commit -m "fix: ativa ficha so apos copiar dias/exercicios (corrige corrida Realtime)

Evita que o aluno receba via Realtime uma ficha ainda sem dias/exercicios.
Plano criado/atualizado como inativo e so marcado is_active=true depois
que todos os dias e exercicios existem."

echo "▶ Push..."
git push origin main

echo ""
echo "✅ Correcao aplicada direto na main."
