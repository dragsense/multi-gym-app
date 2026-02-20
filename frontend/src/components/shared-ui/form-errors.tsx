import { useFormContext, useFormState } from "react-hook-form";
import { useId, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export function FormErrors() {
    // React 19: Essential IDs
    const componentId = useId();
    const { t } = useI18n();

    const { control } = useFormContext();
    const { errors } = useFormState({ control });

    // React 19: Memoized error message extraction for better performance
    const errorMessages = useMemo(() => {
        const getMessages = (errObj: any, prefix = ""): string[] => {
            let msgs: string[] = [];
            for (const key in errObj) {
                if (errObj[key]?.message) {
                    msgs.push(`${prefix}${key}: ${errObj[key].message}`);
                } else if (typeof errObj[key] === "object" && errObj[key] !== null) {
                    msgs = msgs.concat(getMessages(errObj[key], `${prefix}${key}.`));
                }
            }
            return msgs;
        };
        return getMessages(errors);
    }, [errors]);

    if (errorMessages.length === 0) return null;

    return (
        <div className="bg-red-100 text-red-700 text-sm p-2 mt-2 rounded" data-component-id={componentId}>
            <strong>{buildSentence(t, 'please', 'fix', 'the', 'following', 'errors')}:</strong>
            <ul style={{ marginLeft: "1.25rem", listStyleType: "disc" }}>
                {errorMessages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                ))}
            </ul>
        </div>
    );
}
