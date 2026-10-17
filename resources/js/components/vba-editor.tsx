import InstructionalCodeEditor, {
    type InstructionalSourceProps,
} from '@/components/instructional-code-editor';
export default function VbaEditor(props: InstructionalSourceProps) {
    return (
        <InstructionalCodeEditor
            {...props}
            id="vba-code"
            label="VBA CODE · exported module/form source"
            environment="Microsoft Excel Desktop Required."
            instructions="This editor stores VBA source. Compile and run reviewed code in the specified Excel module/UserForm and .xlsm practice workbook."
            footnote="Expected worksheet/dialog results are instructions, not generated output. Saving source does not compile, execute, or approve a macro."
        />
    );
}
