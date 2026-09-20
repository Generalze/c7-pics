import { redirect } from "next/navigation";

/**
 * The Command Centre now lives in the Election Command console at /command,
 * which carries the whole operations design rather than one page of it.
 *
 * The page that stood here rendered against a token vocabulary defined in a
 * stylesheet nothing imported, so every colour, spacing and type declaration
 * was dropped by the browser. Rather than leave a second, unstyled copy of the
 * same screen, this route sends operators to the real one.
 */
export default function LegacyCommandCentrePage() {
  redirect("/command");
}
