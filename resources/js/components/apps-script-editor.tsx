import InstructionalCodeEditor, {
    type InstructionalSourceProps,
} from '@/components/instructional-code-editor';
export default function AppsScriptEditor(props: InstructionalSourceProps) {
    return (
        <InstructionalCodeEditor
            {...props}
            id="apps-script-code"
            label="GOOGLE APPS SCRIPT CODE · Code.gs"
            environment="Google Apps Script / Google Workspace Required."
            instructions="Copy reviewed source into your authorized Google Apps Script project. CodeLab does not execute FormApp, SpreadsheetApp, DriveApp, DocumentApp, MailApp, or GmailApp."
            footnote="Expected results are instructions, not Google execution output. Saving source does not request Google permissions, run a script, or approve its correctness."
        />
    );
}
