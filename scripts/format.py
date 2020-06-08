import glob
import os
import sys

for f in glob.glob(sys.argv[1]):
    outfile = f + ".html"
    out = open(outfile, "w")
    for l in open(f):
        if l.strip().startswith("{{") or l.strip().startswith("{%"):
            # pylint: disable=consider-using-enumerate
            for j in range(len(l)):
                if l[j] != " ":
                    break

            print(" " * j + "<!-- prettier-ignore -->", file=out)

        print(l, end="", file=out)
    out.close()
    os.system("npx prettier %s  --write" % outfile)

    orig = open(f, "w")
    for l in open(outfile):
        # pylint: disable=no-else-continue
        if l.strip().startswith("<!-- prettier-ignore -->"):
            continue
        else:
            print(l, end="", file=orig)

    orig.close()
    os.system("rm %s" % outfile)
