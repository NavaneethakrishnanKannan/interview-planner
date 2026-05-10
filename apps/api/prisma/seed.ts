import { PrismaClient, QuestionDifficulty } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "React",
    "Next.js",
    "Node.js",
    "NestJS",
    "JavaScript",
    "TypeScript",
    "System Design",
    "Authentication",
    "Security",
    "Performance",
    "Design Patterns",
  ];

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { slug: categoryName.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  }

  const reactCategory = await prisma.category.findUnique({
    where: { slug: "react" },
  });

  if (reactCategory) {
    await prisma.question.createMany({
      data: [
        {
          title: "Explain React reconciliation internals",
          prompt: "How does reconciliation work with Fiber and scheduling?",
          answer:
            "Fiber splits work into units, prioritizes updates, and enables interruptible rendering before commit phase.",
          realWorldExample:
            "Large dashboard rerenders can be interrupted to keep input responsive.",
          followUpQuestions: [
            "How do lanes work?",
            "When does React bail out of reconciliation?",
          ],
          difficulty: QuestionDifficulty.HARD,
          seniority: "Senior",
          tags: ["react", "fiber", "reconciliation", "performance"],
          categoryId: reactCategory.id,
        },
      ],
      skipDuplicates: true,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
