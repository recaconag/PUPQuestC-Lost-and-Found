import { FaPlus } from "react-icons/fa";
import { useState } from "react";

interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

const Faq = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqs: FaqItem[] = [
    {
      question: "Who can use PUPQuestC?",
      answer:
        "PUPQuestC is exclusively engineered for the students, faculty, and administrative staff of the Polytechnic University of the Philippines Quezon City. Access is granted through official institutional email authentication.",
    },
    {
      question: "How does the AI-powered search work?",
      answer:
        "PUPQuestC uses the Google Gemini API to intelligently match lost and found items. Even if you describe your item differently from how the finder posted it, our AI understands the context and finds the best possible matches for you.",
    },
    {
      question: "How do I claim a found item?",
      answer:
        "When you find an item that might be yours, click 'Start Claim Process' on the item page. You will need to provide the date you lost it and describe unique identifying features that are not visible in the photo. This strict verification process prevents fake claims.",
    },
    {
      question: "How is my personal information protected?",
      answer:
        "PUPQuestC encrypts all passwords and protects the database with industry-standard security measures. We only collect necessary information like your email and we are fully transparent about how your data is used.",
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-gray-950 relative overflow-hidden">

      <div className="relative px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">

          {/* LEFT */}
          <div className="flex flex-col lg:basis-1/2">
            <p className="font-semibold text-red-600 mb-4">
              FAQ
            </p>

            <h2 className="text-4xl md:text-5xl font-bold gold-text mb-4">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-red-700 to-yellow-500 bg-clip-text text-transparent ">
                Questions
              </span>
            </h2>

            <p className="text-gray-300 text-lg">
              Common questions about reporting, finding, and claiming lost items in PUPQC.
            </p>
          </div>

          {/* RIGHT */}
          <ul className="lg:basis-1/2 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = expandedIndex === index;

              return (
                <li
                  key={index}
                  className="group glass-card rounded-xl overflow-hidden transition-colors duration-200 hover:border-gray-700/60"
                >
                  {/* QUESTION */}
                  <button
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className={`flex items-center gap-4 w-full p-6 text-left font-semibold transition-all duration-200 ${isOpen ? "bg-gray-700/40" : "hover:bg-gray-700/30"
                      }`}
                  >
                    <span className="flex-1 text-white">
                      {faq.question}
                    </span>

                    {/* ROTATING ICON */}
                    <div
                      className={`text-yellow-500 transition-all duration-200 ${isOpen ? "rotate-45 scale-110" : "rotate-0"
                        }`}
                    >
                      <FaPlus />
                    </div>
                  </button>

                  {/* ANSWER */}
                  <div
                    className={`grid transition-all duration-500 ease-in-out ${isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-6 text-gray-300 leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>

                  {/* DIVIDER GLOW */}
                  <div className={`h-[1px] bg-gradient-to-r from-transparent via-red-700/40 to-transparent transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"
                    }`} />
                </li>
              );
            })}
          </ul>

        </div>
      </div>
    </section>
  );
};

export default Faq;